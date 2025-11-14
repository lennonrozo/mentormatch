from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Hobby(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

ROLE_CHOICES = (
    ('student', 'Student'),
    ('professional', 'Professional'),
)

GENDER_CHOICES = (
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
)

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student') 
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    bio = models.TextField(blank=True) 

    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)

    skills_offered = models.ManyToManyField(Skill, blank=True, related_name='offered_by')
    skills_needed = models.ManyToManyField(Skill, blank=True, related_name='needed_by')

    hobbies = models.ManyToManyField(Hobby, blank=True)

    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
  
    show_phone = models.BooleanField(default=False)
    show_email = models.BooleanField(default=False)
    show_age = models.BooleanField(default=False)

    theme = models.CharField(max_length=20, blank=True, default='light')

    is_verified = models.BooleanField(default=False)
    verification_document = models.FileField(upload_to='verifications/', blank=True, null=True)

    deletion_scheduled_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.username

class Swipe(models.Model):

    from_user = models.ForeignKey(User, related_name='swipes_made', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='swipes_received', on_delete=models.CASCADE)
    liked = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

class Match(models.Model):
    user1 = models.ForeignKey(User, related_name='matches1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='matches2', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

class Message(models.Model):
    match = models.ForeignKey(Match, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.sender}: {self.content[:30]}'


class Media(models.Model):
    """User-uploaded media (images/videos/files). Only owner + matches can view."""
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('file', 'File'),
    )
    user = models.ForeignKey(User, related_name='media', on_delete=models.CASCADE)
    file = models.FileField(upload_to='user_media/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    caption = models.CharField(max_length=255, blank=True)

VERIFICATION_STATUS = (
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
)

class VerificationRequest(models.Model):
    user = models.ForeignKey(User, related_name='verification_requests', on_delete=models.CASCADE)
    document = models.FileField(upload_to='verifications/')
    status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer = models.ForeignKey(User, null=True, blank=True, related_name='verified_requests', on_delete=models.SET_NULL)

    def approve(self, reviewer=None):
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewer = reviewer
        self.save()
        self.user.is_verified = True
        self.user.save()

    def reject(self, reviewer=None):
        self.status = 'rejected'
        self.reviewed_at = timezone.now()
        self.reviewer = reviewer
        self.save()
