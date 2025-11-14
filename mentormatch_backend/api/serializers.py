from rest_framework import serializers
from .models import User, Skill, Hobby, Swipe, Match, Message, Media
from django.contrib.auth.password_validation import validate_password

# Serializers translate between Python/Django objects and JSON for the API.
# They also validate incoming data and can create/update model instances.

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    skills_offered = SkillSerializer(many=True, read_only=True)
    skills_needed = SkillSerializer(many=True, read_only=True)
    hobbies = HobbySerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'gender', 'bio',
            'city', 'state', 'country', 'phone', 'date_of_birth',
            'show_phone', 'show_email', 'show_age', 'theme', 'deletion_scheduled_at',
            'skills_offered', 'skills_needed', 'hobbies',
            'is_verified'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request') if hasattr(self, 'context') else None
        is_self = request and request.user.is_authenticated and request.user.id == instance.id
        if not is_self:
            if not instance.show_phone:
                data.pop('phone', None)
            if not instance.show_email:
                data.pop('email', None)
            if not instance.show_age:
                data.pop('date_of_birth', None)
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ProfileUpdateSerializer(serializers.ModelSerializer):
    skills_offered_ids = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    skills_needed_ids = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    hobby_ids = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'gender', 'bio', 'city', 'state', 'country', 'phone', 'email', 'date_of_birth',
            'show_phone', 'show_email', 'show_age', 'theme',
            'skills_offered_ids', 'skills_needed_ids', 'hobby_ids', 'verification_document'
        ]

    def update(self, instance, validated_data):
        offered_ids = validated_data.pop('skills_offered_ids', [])
        needed_ids = validated_data.pop('skills_needed_ids', [])
        hobby_ids = validated_data.pop('hobby_ids', [])
        verification_file = validated_data.pop('verification_document', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if verification_file is not None:
            instance.verification_document = verification_file
            from .models import VerificationRequest
            if instance.role == 'professional':
                VerificationRequest.objects.create(user=instance, document=verification_file)
                instance.is_verified = False
        instance.save()
        from .models import Skill
        if offered_ids is not None:
            offered = []
            for name in offered_ids:
                s, _ = Skill.objects.get_or_create(name=name)
                offered.append(s)
            instance.skills_offered.set(offered)
        if needed_ids is not None:
            needed = []
            for name in needed_ids:
                s, _ = Skill.objects.get_or_create(name=name)
                needed.append(s)
            instance.skills_needed.set(needed)
        if hobby_ids:
            hobbies = []
            from .models import Hobby
            for name in hobby_ids:
                h, _ = Hobby.objects.get_or_create(name=name)
                hobbies.append(h)
            instance.hobbies.set(hobbies)
        return instance


class VerificationRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = __import__('api.models', fromlist=['VerificationRequest']).VerificationRequest
        fields = ['id', 'user', 'document', 'status', 'submitted_at', 'reviewed_at', 'reviewer']
        read_only_fields = ['status', 'submitted_at', 'reviewed_at', 'reviewer']

class SwipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Swipe
        fields = ['id', 'from_user', 'to_user', 'liked', 'timestamp']
        read_only_fields = ['from_user', 'timestamp']

class MatchSerializer(serializers.ModelSerializer):
    user1 = UserSerializer()
    user2 = UserSerializer()

    class Meta:
        model = Match
        fields = ['id', 'user1', 'user2', 'timestamp']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'match', 'sender', 'content', 'timestamp']
        read_only_fields = ['sender', 'timestamp']


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id', 'media_type', 'file', 'caption', 'uploaded_at']

    def validate(self, attrs):
        f = attrs.get('file')
        if f is not None:
            max_size = 10 * 1024 * 1024  # 10MB
            if getattr(f, 'size', 0) > max_size:
                raise serializers.ValidationError({'file': 'File too large (max 10MB).'})
            content_type = getattr(f, 'content_type', None)
            allowed_prefixes = ('image/', 'video/')
            if content_type and not content_type.startswith(allowed_prefixes):
                raise serializers.ValidationError({'file': 'Only images and videos are allowed.'})
        return attrs

    def create(self, validated_data):
        if 'media_type' not in validated_data or not validated_data['media_type']:
            f = validated_data.get('file')
            ct = getattr(f, 'content_type', '') or ''
            if ct.startswith('image/'):
                validated_data['media_type'] = 'image'
            elif ct.startswith('video/'):
                validated_data['media_type'] = 'video'
            else:
                validated_data['media_type'] = 'file'
        return super().create(validated_data)
