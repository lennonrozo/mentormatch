from django.contrib import admin
from .models import User, Skill, Hobby, Swipe, Match, Message

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_verified')

admin.site.register(Skill)
admin.site.register(Hobby)
admin.site.register(Swipe)
admin.site.register(Match)
admin.site.register(Message)

from .models import VerificationRequest


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'submitted_at', 'reviewed_at', 'reviewer')
    list_filter = ('status',)
    actions = ['approve_requests', 'reject_requests']

    def approve_requests(self, request, queryset):
        for req in queryset:
            req.approve(reviewer=request.user)
    approve_requests.short_description = 'Approve selected verification requests'

    def reject_requests(self, request, queryset):
        for req in queryset:
            req.reject(reviewer=request.user)
    reject_requests.short_description = 'Reject selected verification requests'
