"""Initial data for empty database."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AdmissionPreference, City, Institution, Profile, Review, User
from app.security import hash_password

CITY_SLUGS: dict[str, str] = {
    "Москва": "moscow",
    "Санкт-Петербург": "saint-petersburg",
    "Новосибирск": "novosibirsk",
    "Екатеринбург": "ekaterinburg",
    "Казань": "kazan",
    "Нижний Новгород": "nizhny-novgorod",
    "Челябинск": "chelyabinsk",
    "Самара": "samara",
    "Омск": "omsk",
    "Ростов-на-Дону": "rostov-on-don",
    "Уфа": "ufa",
    "Красноярск": "krasnoyarsk",
    "Воронеж": "voronezh",
    "Пермь": "perm",
    "Волгоград": "volgograd",
}


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(User).limit(1)) is not None:
        return

    cities: list[City] = []
    for name, slug in CITY_SLUGS.items():
        c = City(name=name, slug=slug)
        db.add(c)
        cities.append(c)
    db.flush()

    def cid(city_name: str) -> int:
        x = db.scalar(select(City.id).where(City.name == city_name))
        assert x is not None
        return int(x)

    institutions_specs = [
        ("Москва", "Колледж информатики и программирования (демо)", "Демо-описание: подготовка в сфере ИТ."),
        ("Москва", "Политехнический колледж №1 (демо)", "Демо-описание: инженерные специальности."),
        ("Санкт-Петербург", "СПб колледж телекоммуникаций (демо)", "Демо-описание: связь и сети."),
        ("Санкт-Петербург", "Колледж экономики и сервиса (демо)", "Демо-описание: экономика и менеджмент."),
        ("Новосибирск", "НСК индустриальный колледж (демо)", "Демо-описание: машиностроение."),
        ("Екатеринбург", "Уральский медицинский колледж (демо)", "Демо-описание: здравоохранение."),
        ("Казань", "Казанский IT-колледж (демо)", "Демо-описание: разработка ПО."),
    ]
    insts: list[Institution] = []
    for city_name, iname, desc in institutions_specs:
        inst = Institution(name=iname, city_id=cid(city_name), description=desc)
        db.add(inst)
        insts.append(inst)
    db.flush()

    admin = User(
        email="admin@edu.example",
        hashed_password=hash_password("Admin12345"),
        role="admin",
    )
    db.add(admin)
    db.flush()
    db.add(
        Profile(
            user_id=admin.id,
            full_name="Администратор системы",
            age=30,
            city_id=cid("Москва"),
        )
    )
    db.add(AdmissionPreference(user_id=admin.id))

    demo = User(
        email="user@edu.example",
        hashed_password=hash_password("User12345"),
        role="user",
    )
    db.add(demo)
    db.flush()
    db.add(
        Profile(
            user_id=demo.id,
            full_name="Иван Демо",
            age=17,
            city_id=cid("Санкт-Петербург"),
        )
    )
    db.add(
        AdmissionPreference(
            user_id=demo.id,
            preferred_city_id=cid("Санкт-Петербург"),
            study_direction="Информационные технологии",
        )
    )

    db.flush()
    db.add_all(
        [
            Review(
                user_id=demo.id,
                institution_id=insts[0].id,
                rating=5,
                comment="Отличная демо-запись отзыва.",
            ),
            Review(
                user_id=demo.id,
                institution_id=insts[2].id,
                rating=4,
                comment="Интересные программы.",
            ),
        ]
    )
    db.commit()
