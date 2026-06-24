from subjects.models import TaskResult

def result_to_score(result):
        mapping = {
            "Принято": 1.0,
            "Частично принято": 0.5,
        }
        return mapping.get(result, 0.0)

def get_test_stats(test):
    all_results = TaskResult.objects.filter(task__test=test)

    total_score = 0
    total_count = 0
    student_totals = {}

    for result in all_results:
        score = result_to_score(result.result)

        total_score += score
        total_count += 1

        student_totals[result.student_test_id] = (
            student_totals.get(result.student_test_id, 0)
            + score
        )

    mean_score = (
        total_score / total_count
        if total_count
        else 0
    )

    return {
        "mean_score": mean_score,
        "student_totals": student_totals,
    }

def calculate_task_metrics(
    task,
    mean_score_all_test,
):
    results = list(TaskResult.objects.filter(task=task))
    n = len(results)

    if n == 0:
        return None

    values = [
        result_to_score(r.result)
        for r in results
    ]

    mean_score = sum(values) / n

    variance = (
        sum((x - mean_score) ** 2 for x in values)
        / n
    )

    return {
        "n": n,
        "values": values,
        "mean_score": mean_score,
        "success_rate": values.count(1.0) / n,
        "failure_rate": values.count(0.0) / n,
        "variance": variance,
        "uncertainty": values.count(0.5) / n,
        "relative_difficulty": (
            mean_score - mean_score_all_test
        ),
    }

def empty_task_statistics(task):
    return {
        "task_id": task.id,
        "task_topic": task.topic,
        "hours": task.hours,
        "mean_score": None,
        "success_rate": None,
        "failure_rate": None,
        "variance": None,
        "uncertainty": None,
        "relative_difficulty": None,
    }


def task_statistics_response(task, metrics):
    return {
        "task_id": task.id,
        "task_topic": task.topic,
        "hours": task.hours,
        "mean_score": round(metrics["mean_score"], 4),
        "success_rate": round(metrics["success_rate"], 4),
        "failure_rate": round(metrics["failure_rate"], 4),
        "variance": round(metrics["variance"], 4),
        "uncertainty": round(metrics["uncertainty"], 4),
        "relative_difficulty": round(
            metrics["relative_difficulty"],
            4,
        ),
    }

def generate_recommendations(
    test,
    metrics,
):
    recommendations = []

    mean_score = metrics["mean_score"]
    variance = metrics["variance"]
    uncertainty = metrics["uncertainty"]
    relative_difficulty = metrics["relative_difficulty"]

    if (
        mean_score < test.threshold_mean_low
        and variance < test.threshold_variance_low
    ):
        recommendations.append(
            "Рекомендуется увеличить количество часов на разбор темы: "
            "большинство студентов не справляется с заданием."
        )

    elif (
        mean_score < 0.57
        and variance >= test.threshold_variance_high
    ):
        recommendations.append(
            "Рекомендуется увеличить количество часов и предусмотреть "
            "дополнительные занятия для студентов, "
            "которые плохо разобрались в теме, "
            "наблюдается сильный разброс результатов"
        )

    elif (
        mean_score > test.threshold_success_high
        and variance < test.threshold_variance_low
    ):
        recommendations.append(
            "Тема усваивается большинством студентов. "
            "Возможна оптимизация (сокращение количества часов)."
        )

    if uncertainty > test.threshold_uncertainty_high:
        recommendations.append(
            "Высокая доля частичных решений. "
            "Рекомендуется уточнить формулировку задания "
            "и добавить пример решения."
        )

    if (
        relative_difficulty
        < test.threshold_relative_difficulty_low
    ):
        recommendations.append(
            "Эта задача оказалась значительно сложнее остальных "
            "заданий в тесте. Рекомендуется понизить сложность задачи"
        )

    if not recommendations:
        recommendations.append(
            "Корректировка учебного материала не требуется."
        )

    return recommendations

def get_subject_stats(subject):
    tests = subject.tests.all()

    all_scores = []

    for test in tests:
        scores = list(
            test.student_tests.values_list(
                "final_score",
                flat=True,
            )
        )
        all_scores.extend(scores)

    mean_score_all_tests = (
        sum(all_scores) / len(all_scores)
        if all_scores
        else 0
    )

    return {
        "mean_score_all_tests": mean_score_all_tests,
        "tests": tests,
    }


def calculate_test_metrics(
    test,
    mean_score_all_tests,
):
    scores = list(
        test.student_tests.values_list(
            "final_score",
            flat=True,
        )
    )

    n = len(scores)

    if n == 0:
        return None

    scores.sort()

    mean_score = sum(scores) / n

    variance = (
        sum(
            (x - mean_score) ** 2
            for x in scores
        )
        / n
    )

    if n % 2 == 0:
        median_score = (
            scores[n // 2 - 1]
            + scores[n // 2]
        ) / 2
    else:
        median_score = scores[n // 2]

    return {
        "mean_score": mean_score,
        "median_score": median_score,
        "variance": variance,
        "relative_difficulty": (
            mean_score
            - mean_score_all_tests
        ),
    }


def test_statistics_response(
    test,
    metrics,
):
    return {
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
    }

def generate_test_recommendations(
    subject,
    metrics,
):
    recommendations = []

    mean_score = metrics["mean_score"]
    variance = metrics["variance"]
    relative_difficulty = (
        metrics["relative_difficulty"]
    )

    if (
        mean_score < subject.threshold_mean_low
        and variance < subject.threshold_variance_low
    ):
        recommendations.append(
            "Рекомендуется увеличить количество учебных часов по темам, "
            "проверяемым данной контрольной работой. Большинство студентов "
            "испытывает устойчивые затруднения при выполнении заданий."
        )

    elif (
        mean_score < subject.threshold_mean_low
        and variance >= subject.threshold_variance_high
    ):
        recommendations.append(
            "Рекомендуется увеличить количество учебных часов и "
            "предусмотреть дополнительные консультации для студентов, "
            "испытывающих трудности. Наблюдается существенный разброс "
            "результатов, что указывает на неравномерное усвоение материала."
        )

    elif (
        mean_score > subject.threshold_success_high
        and variance < subject.threshold_variance_low
    ):
        recommendations.append(
            "Темы, проверяемые данной контрольной работой, успешно "
            "усваиваются большинством студентов. Возможно сокращение "
            "учебного времени либо перераспределение часов в пользу "
            "более сложных разделов курса."
        )

    if (
        relative_difficulty
        < subject.threshold_relative_difficulty_low
    ):
        recommendations.append(
            "По сравнению с остальными контрольными работами предмета "
            "данная контрольная демонстрирует более низкие результаты. "
            "Рекомендуется увеличить время на изучение соответствующих "
            "тем либо пересмотреть уровень сложности заданий."
        )

    if (
        relative_difficulty
        > subject.threshold_relative_difficulty_high
    ):
        recommendations.append(
            "Темы, проверяемые данной контрольной работой, усваиваются "
            "лучше остальных разделов предмета. Возможно перераспределение "
            "части учебного времени в пользу тем, вызывающих больше "
            "затруднений."
        )

    if not recommendations:
        recommendations.append(
            "Корректировка учебного процесса по результатам данной контрольной работы не требуется."
        )

    return recommendations