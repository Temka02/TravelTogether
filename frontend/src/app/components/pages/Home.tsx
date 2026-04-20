import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Users, RussianRuble } from "lucide-react";
import type { Trip } from "../../types";
import { apiClient } from "../../api/client";
import { Link } from "react-router";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SEO } from "../SEO";

const difficultyMap: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

export function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const limit = 9;

  useEffect(() => {
    loadTrips();
  }, [page, sortBy, order]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getTrips({
        status: "planning,active,completed",
        search: searchQuery || undefined,
        page,
        limit,
        sortBy,
        order,
      });
      if (response.success && response.data) {
        setTrips(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to load trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTrips();
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newOrder] = value.split("-");
    setSortBy(newSortBy);
    setOrder(newOrder as "asc" | "desc");
    setPage(1);
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

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка путешествий...</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <SEO
        title="Найди свое путешествие"
        description="Присоединяйся к увлекательным поездкам с единомышленниками. Организуй свое приключение или найди готовый маршрут."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Найди свое путешествие
          </h1>
          <p className="text-gray-600">
            Присоединяйся к увлекательным поездкам с единомышленниками
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, направлению или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </form>
          <Select value={`${sortBy}-${order}`} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-64 default:p-2">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent className="p-1">
              <SelectItem value="createdAt-desc">Сначала новые</SelectItem>
              <SelectItem value="createdAt-asc">Сначала старые</SelectItem>
              <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
              <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
              <SelectItem value="startDate-asc">Дата начала: раньше</SelectItem>
              <SelectItem value="startDate-desc">Дата начала: позже</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">Путешествия не найдены</p>
            <p className="text-gray-500 mt-2">
              Попробуйте изменить параметры поиска
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip._id}
                  to={`/trips/${trip._id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium capitalize">
                        {difficultyMap[trip.difficulty]}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{trip.destination}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {trip.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{getDurationDays(trip)} дней</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>
                            {trip.participants.length}/{trip.maxParticipants}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                          <RussianRuble className="w-5 h-5" />
                          <span>{trip.price.toLocaleString("ru-RU")} ₽</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {getOrganizerName(trip)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Начало:{" "}
                          {new Date(trip.startDate).toLocaleDateString("ru-RU")}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            trip.status === "planning"
                              ? "bg-yellow-100 text-yellow-800"
                              : trip.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {trip.status === "planning"
                            ? "Планируется"
                            : trip.status === "active"
                              ? "Активна"
                              : "Завершена"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={
                          page === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => setPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={
                          page === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        <div className="text-center pt-16 pb-4">
          <p className="text-gray-800 text-lg">Не нашли ничего по душе?</p>
          <Link to={`/trips/create-trip`}>
            <p className="mt-2 text-xl text-blue-800 font-semibold">
              Организуйте свое путешествие!
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
