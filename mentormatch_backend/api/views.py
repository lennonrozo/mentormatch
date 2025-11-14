from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .serializers import RegisterSerializer, UserSerializer, ProfileUpdateSerializer, SwipeSerializer, MatchSerializer, MessageSerializer, MediaSerializer
from .models import User, Swipe, Match, Message, Media
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class ProfileUpdateView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user

class PotentialMatchesView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        opposite_role = 'professional' if user.role == 'student' else 'student'
        candidates = User.objects.filter(role=opposite_role).exclude(id=user.id)
        if user.role == 'student':
            candidates = candidates.filter(is_verified=True)
        global_flag = request.query_params.get('global') == '1'
        if not global_flag and user.city and user.country:
            candidates = candidates.filter(country=user.country)
            if user.state:
                candidates = candidates.filter(state=user.state)
        offered_filter = request.query_params.get('offered')
        needed_filter = request.query_params.get('needed')
        if offered_filter:
            candidates = candidates.filter(skills_offered__name__iexact=offered_filter)
        if needed_filter:
            candidates = candidates.filter(skills_needed__name__iexact=needed_filter)
        results = []
        user_offered = set(s.lower() for s in user.skills_offered.values_list('name', flat=True))
        user_needed = set(s.lower() for s in user.skills_needed.values_list('name', flat=True))

        for c in candidates:
            cs_offered = set(s.lower() for s in c.skills_offered.values_list('name', flat=True))
            cs_needed = set(s.lower() for s in c.skills_needed.values_list('name', flat=True))
            cross_teach_overlap = len(user_needed & cs_offered) + len(user_offered & cs_needed)
            offered_synergy = len(user_offered & cs_offered)
            needed_synergy = len(user_needed & cs_needed)

            teach_union = len(user_needed | cs_offered) or 1
            learn_union = len(user_offered | cs_needed) or 1
            teach_jaccard = cross_teach_overlap / teach_union
            learn_jaccard = cross_teach_overlap / learn_union
            synergy_score = (offered_synergy + needed_synergy) / ((len(user_offered)+len(user_needed)) or 1)
            score = teach_jaccard * 0.7 + learn_jaccard * 0.2 + synergy_score * 0.1
            if c.is_verified and user.role == 'student':
                score += 0.1
            score = min(100, round(score * 100))
            results.append({'user': UserSerializer(c).data, 'score': score})
        results.sort(key=lambda x: x['score'], reverse=True)
        return Response(results)


class VerificationRequestListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        from .models import VerificationRequest
        qs = VerificationRequest.objects.order_by('-submitted_at')
        from .serializers import VerificationRequestSerializer
        return Response(VerificationRequestSerializer(qs, many=True).data)


class VerificationRequestUpdateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, req_id):
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        from .models import VerificationRequest
        try:
            req = VerificationRequest.objects.get(id=req_id)
        except VerificationRequest.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get('action')
        if action == 'approve':
            req.approve(reviewer=request.user)
        elif action == 'reject':
            req.reject(reviewer=request.user)
        else:
            return Response({'detail': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        from .serializers import VerificationRequestSerializer
        return Response(VerificationRequestSerializer(req).data)

class SwipeView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SwipeSerializer

    def create(self, request, *args, **kwargs):
        from_user = request.user
        to_user_id = request.data.get('to_user')
        liked = request.data.get('liked', False)
        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        swipe, created = Swipe.objects.update_or_create(from_user=from_user, to_user=to_user, defaults={'liked': liked})
        if liked:
            reciprocal = Swipe.objects.filter(from_user=to_user, to_user=from_user, liked=True).first()
            if reciprocal:
                u1, u2 = (from_user, to_user) if from_user.id < to_user.id else (to_user, from_user)
                match, m_created = Match.objects.get_or_create(user1=u1, user2=u2)
                return Response({'matched': True, 'match': MatchSerializer(match).data})
        return Response({'matched': False})

class MatchListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = MatchSerializer

    def get_queryset(self):
        user = self.request.user
        return Match.objects.filter(Q(user1=user) | Q(user2=user)).order_by('-timestamp')

class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = MessageSerializer

    def get_queryset(self):
        from django.utils.dateparse import parse_datetime
        match_id = self.kwargs['match_id']
        # Only allow access if the requesting user is part of the match
        is_participant = Match.objects.filter(
            Q(id=match_id) & (Q(user1=self.request.user) | Q(user2=self.request.user))
        ).exists()
        if not is_participant:
            return Message.objects.none()
        qs = Message.objects.filter(match_id=match_id).order_by('timestamp')
        # Optional incremental fetch: /api/messages/<id>/?since=ISO_DATETIME
        since = self.request.query_params.get('since')
        if since:
            dt = parse_datetime(since)
            if dt:
                qs = qs.filter(timestamp__gt=dt)
        return qs

    def perform_create(self, serializer):
        # Sender is always the authenticated user
        serializer.save(sender=self.request.user)


class UserDetailView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = 'id'


class MediaListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = MediaSerializer

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        if str(self.request.user.id) == str(user_id):
            return Media.objects.filter(user_id=user_id).order_by('-uploaded_at')
        matched = Match.objects.filter(
            (Q(user1_id=self.request.user.id, user2_id=user_id) | Q(user2_id=self.request.user.id, user1_id=user_id))
        ).exists()
        if matched:
            return Media.objects.filter(user_id=user_id).order_by('-uploaded_at')
        return Media.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountDeletionScheduleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.deletion_scheduled_at:
            return Response({'detail': 'Deletion already scheduled.'}, status=400)
        user.deletion_scheduled_at = timezone.now()
        user.save()
        return Response({'detail': 'Account deletion scheduled.'})

    def delete(self, request):
        user = request.user
        user.deletion_scheduled_at = None
        user.save()
        return Response({'detail': 'Account deletion canceled.'})
