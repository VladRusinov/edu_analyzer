from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from subjects.views.subject import SubjectViewSet
from subjects.views.test import TestViewSet
from subjects.views.task import TaskViewSet
from subjects.views.studentTest import StudentTestViewSet
from subjects.views.taskResult import TaskResultViewSet
from subjects.views.register import RegisterView
from subjects.views.changePassword import ChangePasswordView

router = DefaultRouter()
router.register(r"subjects", SubjectViewSet, basename="subject")
router.register(r"tests", TestViewSet, basename="test")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"student-tests", StudentTestViewSet, basename="student-test")
router.register(r"task-results", TaskResultViewSet, basename="task-result")

urlpatterns = [
    path("", include(router.urls)),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/", include("rest_framework.urls")),
    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="auth_change_password"
    ),
    path("register/", RegisterView.as_view(), name="auth_register"),
]
