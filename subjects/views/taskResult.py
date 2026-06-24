from rest_framework import viewsets

from subjects.models import TaskResult
from subjects.serializers import TaskResultSerializer


class TaskResultViewSet(viewsets.ModelViewSet):
    queryset = TaskResult.objects.all()
    serializer_class = TaskResultSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        student_test_id = self.request.query_params.get("student_test")
        if student_test_id:
            queryset = queryset.filter(student_test_id=student_test_id)
        return queryset
