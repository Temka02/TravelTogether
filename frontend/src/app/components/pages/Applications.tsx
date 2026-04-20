import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Application, Trip, User } from "../../types";
import { apiClient } from "../../api/client";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Avatar,
} from "@mui/material";
import { Check, Close } from "@mui/icons-material";
import { Helmet } from "react-helmet-async";

export default function Applications() {
  const { user, updateUser } = useAuth();
  const [incoming, setIncoming] = useState<Application[]>([]);
  const [outgoing, setOutgoing] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadApps();
  }, [user]);

  const loadApps = async () => {
    try {
      const [inc, out] = await Promise.all([
        apiClient.getApplicationsToMyTrips(),
        apiClient.getMyApplications(),
      ]);
      if (inc.success && inc.data) setIncoming(inc.data);
      if (out.success && out.data) setOutgoing(out.data);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (
    appId: string,
    decision: "accept" | "reject",
  ) => {
    setProcessingId(appId);
    try {
      if (decision === "accept") await apiClient.acceptApplication(appId);
      else await apiClient.rejectApplication(appId);
      await loadApps();
      const me = await apiClient.getMe();
      if (me.success && me.data) updateUser(me.data);
    } catch (err: any) {
      alert(err.message || "Ошибка обработки");
    } finally {
      setProcessingId(null);
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

  const renderApp = (app: Application, type: "incoming" | "outgoing") => {
    const trip = app.tripId as Trip;
    const userObj = app.userId as User;
    const isPending = app.status === "pending";
    const isAccepted = app.status === "accepted";

    return (
      <Card key={app._id} variant="outlined" className="mb-4">
        <CardContent>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Typography variant="h6" className="text-blue-600">
                {trip?.title || "Поездка"}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                {trip?.destination}
              </Typography>
              {type === "incoming" && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {userObj?.firstName?.[0] || "?"}
                  </Avatar>
                  <Typography variant="body2">
                    {userObj?.firstName} {userObj?.lastName}
                  </Typography>
                </div>
              )}
              {app.message && (
                <Typography
                  variant="body2"
                  className="mt-2 italic text-gray-600"
                >
                  Сообщение: {app.message}
                </Typography>
              )}
              <div className="flex gap-2 mt-3">
                <Chip
                  label={
                    isPending ? "Ожидает" : isAccepted ? "Принята" : "Отклонена"
                  }
                  color={
                    isPending ? "warning" : isAccepted ? "success" : "error"
                  }
                  size="small"
                />
              </div>
            </div>
            {type === "incoming" && isPending && (
              <div className="flex gap-2">
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<Check />}
                  onClick={() => handleDecision(app._id, "accept")}
                  disabled={processingId === app._id}
                >
                  Принять
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Close />}
                  onClick={() => handleDecision(app._id, "reject")}
                  disabled={processingId === app._id}
                >
                  Отклонить
                </Button>
              </div>
            )}
            {type === "outgoing" && !isPending && (
              <Typography variant="caption" color="textSecondary">
                {isAccepted ? "✓ Принято" : "✗ Отклонено"}
              </Typography>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Box className="max-w-3xl mx-auto my-8 p-4">
        <Typography
          variant="h4"
          component="h1"
          className="text-center text-blue-700 font-bold mb-6"
        >
          Заявки
        </Typography>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          centered
          className="mb-6"
        >
          <Tab label="Входящие (на мои поездки)" />
          <Tab label="Исходящие (мои заявки)" />
        </Tabs>
        {tabValue === 0 &&
          (incoming.length === 0 ? (
            <Typography color="textSecondary" className="text-center">
              Нет входящих заявок
            </Typography>
          ) : (
            incoming.map((a) => renderApp(a, "incoming"))
          ))}
        {tabValue === 1 &&
          (outgoing.length === 0 ? (
            <Typography color="textSecondary" className="text-center">
              Вы ещё не подавали заявок
            </Typography>
          ) : (
            outgoing.map((a) => renderApp(a, "outgoing"))
          ))}
      </Box>
    </>
  );
}
