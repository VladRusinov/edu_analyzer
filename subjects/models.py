from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Электронная почта обязательна')
        email = self.normalize_email(email)
        
        extra_fields.setdefault('username', None)
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []


class Subject(models.Model):
    name = models.CharField(max_length=255)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subjects"
    )
    threshold_mean_low = models.FloatField(
        default=3.5
    )

    threshold_variance_low = models.FloatField(
        default=0.3
    )

    threshold_variance_high = models.FloatField(
        default=0.9
    )

    threshold_success_high = models.FloatField(
        default=4.5
    )

    threshold_relative_difficulty_low = models.FloatField(
        default=-0.5
    )

    threshold_relative_difficulty_high = models.FloatField(
        default=0.5
    )

    def __str__(self):
        return self.name


class Test(models.Model):
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="tests"
    )
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    threshold_mean_low = models.FloatField(default=0.4)
    threshold_variance_low = models.FloatField(default=0.15)
    threshold_variance_high = models.FloatField(default=0.18)
    threshold_uncertainty_high = models.FloatField(default=0.4)
    threshold_success_high = models.FloatField(default=0.75)
    threshold_relative_difficulty_low = models.FloatField(default=-0.25)

    def __str__(self):
        return f"{self.title} ({self.subject.name})"


class StudentTest(models.Model):
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name="student_tests"
    )
    student_name = models.CharField(max_length=255)
    final_score = models.FloatField()

    def __str__(self):
        return f"{self.student_name} — {self.test.title}"


class Task(models.Model):
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    topic = models.CharField(
        max_length=255
    )
    result = models.CharField(max_length=20)
    hours = models.FloatField(default=0)

    def __str__(self):
        return f"{self.topic} ({self.hours} ч.)"


class TaskResult(models.Model):
    student_test = models.ForeignKey(
        StudentTest,
        on_delete=models.CASCADE,
        related_name="task_results"
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE
    )
    result = models.CharField(max_length=20)
