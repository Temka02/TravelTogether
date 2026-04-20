import { useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../api/client";
import type { Trip } from "../types";

interface TripFormData {
  title: string;
  destination: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  price: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
}

interface UseTripFormOptions {
  initialData?: Partial<Trip>;
  isEdit?: boolean;
  tripId?: string;
}

export const useTripForm = (options: UseTripFormOptions = {}) => {
  const navigate = useNavigate();
  const { initialData, isEdit = false, tripId } = options;

  const [title, setTitle] = useState(initialData?.title || "");
  const [destination, setDestination] = useState(
    initialData?.destination || "",
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    initialData?.difficulty || "medium",
  );
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [maxParticipants, setMaxParticipants] = useState(
    initialData?.maxParticipants || 1,
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate?.slice(0, 10) || "",
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate?.slice(0, 10) || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Введите название";
    if (!destination.trim()) newErrors.destination = "Введите направление";
    if (!description.trim()) newErrors.description = "Введите описание";
    if (Number(price) <= 0) newErrors.price = "Цена должна быть больше 0";
    if (maxParticipants < 1 || maxParticipants > 50)
      newErrors.maxParticipants = "От 1 до 50 участников";
    if (!startDate) newErrors.startDate = "Укажите дату начала";
    if (!endDate) newErrors.endDate = "Укажите дату окончания";
    if (startDate && endDate && new Date(endDate) < new Date(startDate))
      newErrors.endDate = "Окончание не может быть раньше начала";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const tripData: TripFormData = {
        title,
        destination,
        description,
        difficulty,
        price: Number(price),
        maxParticipants,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };
      let response;
      if (isEdit && tripId) {
        response = await apiClient.updateTrip(tripId, tripData);
      } else {
        response = await apiClient.createTrip(tripData);
      }
      if (response.success && response.data) {
        alert(isEdit ? "Поездка успешно обновлена" : "Поездка успешно создана");
        navigate(`/trips/${response.data._id}`);
      } else {
        setErrors({ form: response.error || "Ошибка при сохранении" });
      }
    } catch (error: any) {
      setErrors({ form: error.message || "Ошибка сервера" });
    } finally {
      setLoading(false);
    }
  };

  return {
    title,
    setTitle,
    destination,
    setDestination,
    description,
    setDescription,
    difficulty,
    setDifficulty,
    price,
    setPrice,
    maxParticipants,
    setMaxParticipants,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    errors,
    loading,
    validate,
    submit,
    today,
  };
};
