from rest_framework import serializers
from .models import (Subject, Test, Task, TaskResult, StudentTest)
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "test", "topic", "hours"]
        read_only_fields = ["id"]


class TestSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    num_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id", "subject", "title", "created_at", "tasks", "num_tasks",
            "threshold_mean_low", "threshold_variance_low",
            "threshold_variance_high", "threshold_uncertainty_high",
            "threshold_success_high", "threshold_relative_difficulty_low",
        ]

    def get_num_tasks(self, obj):
        return obj.tasks.count()


class TaskResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskResult
        fields = ["id", "student_test", "task", "result"]


class StudentTestSerializer(serializers.ModelSerializer):
    task_results = TaskResultSerializer(many=True, read_only=True)

    test_id = serializers.PrimaryKeyRelatedField(
        queryset=Test.objects.all(),
        source="test",
        write_only=True
    )

    class Meta:
        model = StudentTest
        fields = [
            "id",
            "student_name",
            "final_score",
            "test",
            "test_id",
            "task_results",
        ]
        read_only_fields = ["id", "test"]
