import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Trip } from "../../types";
import { apiClient } from "../../api/client";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { Link } from "react-router";
import { Helmet } from "react-helmet-async";

export default function MyTrips() {
  const { user } = useAuth();
  const [organizedTrips, setOrganizedTrips] = useState<Trip[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  const loadTrips = async () => {
    try {
      const response = await apiClient.getTrips({
        status: "planning,active,completed",
      });

      if (response.success && response.data) {
        const allTrips = response.data;
        console.log(user?.joinedTrips);
        const organizedIds = (user?.organizedTrips || []).map((trip) =>
          typeof trip === "string" ? trip : trip._id,
        );
        const joinedIds = (user?.joinedTrips || []).map((trip) =>
          typeof trip === "string" ? trip : trip._id,
        );
        setOrganizedTrips(
          allTrips.filter((trip) => organizedIds.includes(trip._id)),
        );
        setJoinedTrips(allTrips.filter((trip) => joinedIds.includes(trip._id)));
      }
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Box className="flex justify-center items-center min-h-[60vh]">
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box className="max-w-4xl mx-auto my-8 p-4">
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  const current = tabValue === 0 ? organizedTrips : joinedTrips;
  const title =
    tabValue === 0 ? "Организованные поездки" : "Поездки, в которых я участвую";

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Box className="max-w-4xl mx-auto my-8 p-4">
        <Typography
          variant="h4"
          component="h1"
          className="text-center text-blue-700 font-bold mb-6"
        >
          Мои поездки
        </Typography>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          centered
          className="mb-6"
        >
          <Tab label="Организованные" />
          <Tab label="Участие" />
        </Tabs>
        <Typography variant="h6" className="mb-4">
          {title}
        </Typography>
        {current.length === 0 ? (
          <Typography color="textSecondary" className="text-center">
            Нет поездок
          </Typography>
        ) : (
          <div className="space-y-4">
            {current.map((trip) => (
              <Card
                key={trip._id}
                variant="outlined"
                className="hover:shadow-md transition-shadow"
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    component={Link}
                    to={`/trips/${trip._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {trip.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {trip.destination}
                  </Typography>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Chip
                      label={`${trip.startDate?.slice(0, 10)} – ${trip.endDate?.slice(0, 10)}`}
                      size="small"
                    />
                    <Chip
                      label={`Участников: ${trip.participants?.length || 0}/${trip.maxParticipants}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={
                        trip.difficulty === "easy"
                          ? "Лёгкий"
                          : trip.difficulty === "medium"
                            ? "Средний"
                            : "Сложный"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Box>
    </>
  );
}
