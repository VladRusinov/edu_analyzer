from rest_framework import viewsets
from subjects.models import Subject
from subjects.serializers import SubjectSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

from subjects.services.analytics import (
    get_subject_stats,
    calculate_test_metrics,
    generate_test_recommendations,
)

from subjects.services.analytics import (
    get_subject_stats,
    calculate_test_metrics,
    test_statistics_response,
)


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return Subject.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["get"], url_path="statistics")
    def statistics(
        self,
        request,
        pk=None,
    ):
        subject = self.get_object()

        stats = get_subject_stats(subject)

        statistics = []

        for test in stats["tests"]:
            metrics = calculate_test_metrics(
                test,
                stats["mean_score_all_tests"],
            )

            if metrics is None:
                statistics.append({
                    "test_id": test.id,
                    "test_title": test.title,
                    "mean_score": None,
                    "median_score": None,
                    "variance": None,
                    "relative_difficulty": None,
                })
                continue

            statistics.append(
                test_statistics_response(
                    test,
                    metrics,
                )
            )

        return Response({
            "subject_id": subject.id,
            "subject_name": subject.name,
            "mean_score_all_tests": round(
                stats["mean_score_all_tests"],
                4,
            ),
            "statistics": statistics,
        })

    @action(detail=True, methods=["get"], url_path="recommendations")
    def recommendations(
        self,
        request,
        pk=None,
    ):
        subject = self.get_object()

        stats = get_subject_stats(subject)

        recommendations = []

        for test in stats["tests"]:

            metrics = calculate_test_metrics(
                test,
                stats["mean_score_all_tests"],
            )

            if metrics is None:
                recommendations.append({
                    "test_id": test.id,
                    "test_title": test.title,
                    "recommendations": [
                        "Недостаточно данных для формирования рекомендаций."
                    ],
                })
                continue

            recommendations.append({
                "test_id": test.id,
                "test_title": test.title,
                "mean_score": round(
                    metrics["mean_score"],
                    4,
                ),
                "median_score": round(
                    metrics["median_score"],
                    4,
                ),
                "variance": round(
                    metrics["variance"],
                    4,
                ),
                "relative_difficulty": round(
                    metrics["relative_difficulty"],
                    4,
                ),
                "recommendations":
                    generate_test_recommendations(
                        subject,
                        metrics,
                    ),
            })

        return Response({
            "subject_id": subject.id,
            "subject_name": subject.name,
            "recommendations": recommendations,
        })
