from rest_framework import generics
from rest_framework.permissions import AllowAny

from subjects.models import User
from subjects.serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer