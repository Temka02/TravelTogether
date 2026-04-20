import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import { Helmet } from "react-helmet-async";
import { useTripForm } from "../../hooks/useTripForm";

export default function CreateTrip() {
  const {
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
    submit,
    today,
  } = useTripForm({ isEdit: false });

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-2xl mx-auto my-12 p-10 bg-white rounded-2xl shadow-md">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Создайте свое собственное путешествие:
        </h2>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="form-field">
            <label htmlFor="title">Название:</label>
            <TextField
              data-testid="title-input"
              fullWidth
              required
              id="Title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
            />
          </div>
          <div className="form-field">
            <label htmlFor="destination">Направление:</label>
            <TextField
              data-testid="destination-input"
              fullWidth
              required
              id="destination"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              error={!!errors.destination}
              helperText={errors.destination}
            />
          </div>
          <div className="form-field">
            <label htmlFor="description">Описание:</label>
            <TextField
              data-testid="description-input"
              fullWidth
              required
              id="description"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
            />
          </div>
          <div className="form-field">
            <label htmlFor="difficulty-select">Сложность:</label>
            <Select
              data-testid="difficulty-select"
              fullWidth
              id="difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              displayEmpty
              error={!!errors.difficulty}
            >
              <MenuItem value="easy">Легкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="hard">Сложный</MenuItem>
            </Select>
          </div>
          <div className="form-field">
            <label htmlFor="price">Стоимость (₽):</label>
            <TextField
              data-testid="price-input"
              fullWidth
              required
              id="price"
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={!!errors.price}
              helperText={errors.price}
              slotProps={{ htmlInput: { min: 0, step: 1, max: 999999 } }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="maxParticipants">Количество участников</label>
            <TextField
              data-testid="max-participants-input"
              fullWidth
              required
              id="maxParticipants"
              type="number"
              placeholder="Max participants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              error={!!errors.maxParticipants}
              helperText={errors.maxParticipants}
            />
          </div>
          <div className="form-field">
            <label htmlFor="">Дата начала:</label>
            <TextField
              data-testid="start-date-input"
              fullWidth
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ htmlInput: { min: today } }}
              error={!!errors.startDate}
              helperText={errors.startDate}
            />
          </div>
          <div className="form-field">
            <label htmlFor="">Дата окончания</label>
            <TextField
              data-testid="end-date-input"
              fullWidth
              required
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ htmlInput: { min: startDate || today } }}
              error={!!errors.endDate}
              helperText={errors.endDate}
            />
          </div>
          {errors.form && (
            <p className="text-red-600 text-center">{errors.form}</p>
          )}
          <Button
            data-testid="submit-button"
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            className="!bg-blue-600 hover:!bg-blue-700"
          >
            {loading ? "Создание..." : "Создать"}
          </Button>
        </form>
      </div>
    </>
  );
}
