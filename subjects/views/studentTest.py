from rest_framework import viewsets

from subjects.models import StudentTest
from subjects.serializers import StudentTestSerializer


class StudentTestViewSet(viewsets.ModelViewSet):
    queryset = StudentTest.objects.all()
    serializer_class = StudentTestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        test_id = self.request.query_params.get("test")
        if test_id:
            queryset = queryset.filter(test_id=test_id)
        return queryset
