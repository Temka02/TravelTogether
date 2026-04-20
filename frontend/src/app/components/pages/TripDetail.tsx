import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  ArrowLeft,
  Send,
} from "lucide-react";
import type { Trip, User, WeatherData } from "../../types/index";
import { apiClient } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { SEO } from "../SEO";
import { Helmet } from "react-helmet-async";

const difficultyMap: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

export function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<
    "none" | "pending" | "accepted" | "rejected"
  >("none");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (id) {
      loadTrip();
      if (isAuthenticated) {
        checkApplication();
      }
    }
  }, [id, isAuthenticated]);

  const loadTrip = async () => {
    try {
      const response = await apiClient.getTripById(id!);
      if (response.success && response.data) {
        setTrip(response.data);
        const city = response.data.destination.split(",")[0].trim();
        loadWeather(city);
      }
    } catch (error) {
      console.error("Failed to load trip:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    try {
      const response = await apiClient.checkApplication(id!);
      if (response.success && response.data) {
        setApplicationStatus(response.data.status);
      }
    } catch (error) {
      console.error("Failed to check application:", error);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      alert("Пожалуйста, войдите в систему");
      return;
    }

    setApplying(true);
    try {
      await apiClient.createApplication(id!, applicationMessage);
      setApplicationStatus("pending");
      setApplicationMessage("");
      alert("Заявка успешно отправлена!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Ошибка при отправке заявки");
    } finally {
      setApplying(false);
    }
  };

  const getDurationDays = (trip: Trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getOrganizerName = (trip: Trip): string => {
    if (typeof trip.createdBy === "string") return "Организатор";
    return `${trip.createdBy.firstName} ${trip.createdBy.lastName}`;
  };

  const loadWeather = async (city: string) => {
    try {
      const response = await apiClient.getWeather(city);
      if (response.success && response.data) {
        setWeather(response.data);
      }
    } catch (error) {
      console.error("Weather fetch failed:", error);
    }
  };

  const tripJsonLd = trip
    ? {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: trip.title,
        description: trip.description,
        touristType: "Adventure",
        offers: {
          "@type": "Offer",
          price: trip.price,
          priceCurrency: "RUB",
          availability:
            trip.participants.length < trip.maxParticipants
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
        },
        startDate: trip.startDate,
        endDate: trip.endDate,
        provider: {
          "@type": "Person",
          name: getOrganizerName(trip),
        },
        itinerary: {
          "@type": "Place",
          name: trip.destination,
        },
      }
    : null;

  const isOrganizer =
    trip &&
    user &&
    typeof trip.createdBy !== "string" &&
    trip.createdBy._id === user._id;

  const isParticipant =
    trip &&
    user &&
    trip.participants.some((p) =>
      typeof p === "string" ? p === user._id : (p as User)._id === user._id,
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Маршрут не найден</h2>
        <Link to="/" className="text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={trip.title}
        description={trip.description}
        canonicalUrl={`/trips/${trip._id}`}
        type="article"
      />
      {tripJsonLd && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(tripJsonLd)}
          </script>
        </Helmet>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад к маршрутам</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative h-96 bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-4xl font-bold mb-2">{trip.title}</h1>
              <div className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5" />
                <span>{trip.destination}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Описание</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {trip.description}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    План путешествия
                  </h2>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">
                          Встреча и инструктаж
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Встреча группы, знакомство, распределение снаряжения и
                          инструктаж по технике безопасности
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Основной маршрут</h3>
                        <p className="text-gray-600 text-sm">
                          Прохождение основных точек маршрута с остановками в
                          живописных местах
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">
                          Завершение путешествия
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Возвращение в базовый лагерь, подведение итогов и
                          обмен впечатлениями
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-gray-50 rounded-xl p-6 space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {trip.price.toLocaleString("ru-RU")} ₽
                    </div>
                    <div className="text-sm text-gray-600">за человека</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">
                          Длительность
                        </div>
                        <div className="font-medium">
                          {getDurationDays(trip)} дней
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Сложность</div>
                        <div className="font-medium">
                          {difficultyMap[trip.difficulty]}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Даты</div>
                        <div className="font-medium">
                          {new Date(trip.startDate).toLocaleDateString("ru-RU")}{" "}
                          - {new Date(trip.endDate).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Участники</div>
                        <div className="font-medium">
                          {trip.participants.length}/{trip.maxParticipants}
                        </div>
                      </div>
                    </div>
                  </div>
                  {weather && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold mb-3">
                        Погода в городе {weather.city}
                      </h3>
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                          alt={weather.description}
                          className="w-12 h-12"
                        />
                        <div>
                          <div className="text-2xl font-bold">
                            {Math.round(weather.temp)}°C
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {weather.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold mb-3">Организатор</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {getOrganizerName(trip).charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {getOrganizerName(trip)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Опытный гид
                          </div>
                        </div>
                      </div>
                      {(isOrganizer || user?.role === "admin") && (
                        <Link
                          to={`/trips/edit-trip/${trip._id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Редактировать
                        </Link>
                      )}
                    </div>
                  </div>

                  {isAuthenticated && !isOrganizer && !isParticipant && (
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      {applicationStatus === "none" && (
                        <>
                          <textarea
                            value={applicationMessage}
                            onChange={(e) =>
                              setApplicationMessage(e.target.value)
                            }
                            placeholder="Сообщение для организатора (необязательно)"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                            rows={3}
                          />
                          <button
                            onClick={handleApply}
                            disabled={applying}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
                          >
                            <Send className="w-5 h-5" />
                            {applying ? "Отправка..." : "Подать заявку"}
                          </button>
                        </>
                      )}
                      {applicationStatus === "pending" && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
                          Заявка отправлена. Ожидайте ответа от организатора.
                        </div>
                      )}
                      {applicationStatus === "accepted" && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
                          Ваша заявка принята! Вы участник этой поездки.
                        </div>
                      )}
                      {applicationStatus === "rejected" && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
                          К сожалению, ваша заявка была отклонена.
                        </div>
                      )}
                    </div>
                  )}

                  {isParticipant && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-medium">
                        ✓ Вы участник этой поездки
                      </div>
                    </div>
                  )}

                  {isOrganizer && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center font-medium">
                        Вы организатор этой поездки
                      </div>
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="border-t border-gray-200 pt-4">
                      <Link
                        to="/login"
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center"
                      >
                        Войти, чтобы подать заявку
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
