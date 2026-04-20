import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  AlertCircle,
  Award,
  User as UserIcon,
  Camera,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { apiClient } from "../../api/client";
import { Helmet } from "react-helmet-async";

export function Profile() {
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    loadAvatar();
  }, [loading, isAuthenticated, user]);

  const loadAvatar = async () => {
    try {
      const data = await apiClient.getAvatar();
      if (data.success) {
        setAvatarUrl(data.avatarUrl);
      }
    } catch (error) {
      console.error("Failed to load avatar:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5 МБ");
      return;
    }

    setUploading(true);
    try {
      const data = await apiClient.uploadAvatar(file);
      if (data.success) {
        setAvatarUrl(data.avatarUrl);
        const meResponse = await apiClient.getMe();
        if (meResponse.success && meResponse.data) {
          updateUser(meResponse.data);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Ошибка загрузки аватара");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasMedicalInfo =
    (user.allergies?.length ?? 0) > 0 ||
    (user.medicalConditions?.length ?? 0) > 0 ||
    (user.dietaryRestrictions?.length ?? 0) > 0;

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32" />

          <div className="px-8 pb-8">
            <div className="flex items-end gap-3 -mt-12 mb-6">
              <div className="relative group">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
                      {userInitials}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <h1 className="text-3xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {user.tripsAsOrganizer}
                </div>
                <div className="text-sm text-gray-600">Организовано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {user.tripsAsParticipant}
                </div>
                <div className="text-sm text-gray-600">Участвую</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {user.tripsAsOrganizer + user.tripsAsParticipant}
                </div>
                <div className="text-sm text-gray-600">Всего</div>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Основная информация
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium">{user.email}</div>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Телефон</div>
                        <div className="font-medium">{user.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
                {user.aboutMe && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">О себе</div>
                    <p className="text-gray-800">{user.aboutMe}</p>
                  </div>
                )}
              </section>

              {hasMedicalInfo && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Медицинская информация
                  </h2>
                  <div className="space-y-3">
                    {user.allergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="font-medium text-red-900 mb-2">
                          Аллергии
                        </div>
                        <ul className="space-y-1">
                          {user.allergies.map((allergy, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-red-800"
                            >
                              <span className="mt-1">•</span>
                              <span>{allergy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {user.medicalConditions.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="font-medium text-orange-900 mb-2">
                          Медицинские показания
                        </div>
                        <ul className="space-y-1">
                          {user.medicalConditions.map((condition, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-orange-800"
                            >
                              <span className="mt-1">•</span>
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {user.dietaryRestrictions.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="font-medium text-yellow-900 mb-2">
                          Диетические ограничения
                        </div>
                        <ul className="space-y-1">
                          {user.dietaryRestrictions.map(
                            (restriction, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-yellow-800"
                              >
                                <span className="mt-1">•</span>
                                <span>{restriction}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {user.skills?.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Навыки и умения
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className={`px-4 py-2 rounded-full font-medium ${
                          user.mainSkills.includes(skill)
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {skill}
                        {user.mainSkills.includes(skill) && " ⭐"}
                      </span>
                    ))}
                  </div>
                  {user.mainSkills.length > 0 && (
                    <p className="text-sm text-gray-600 mt-3">
                      ⭐ - основные навыки
                    </p>
                  )}
                </section>
              )}

              <div className="pt-6">
                <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Редактировать профиль
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
