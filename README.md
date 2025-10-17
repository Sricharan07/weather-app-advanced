# Weather App - Sri Charan Reddy Bodicherla

## Overview
Full-stack weather application with comprehensive CRUD operations, date range weather tracking, and multi-format data export. Built for PM Accelerator AI Engineer Internship assessment. This application provides real-time weather data, multi-day forecasts, and complete database management for weather queries with downloadable reports.

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **APIs**: OpenWeatherMap API
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **HTTP Client**: Axios

## Features

### Core Weather Features
- Location search by city name, zip code, or GPS coordinates
- Auto-complete city suggestions with coordinates
- Current weather display with comprehensive metrics
- Weather icons from OpenWeatherMap
- 5-day detailed forecast
- Date range weather data (all days between start and end dates)
- Auto-detect current location using browser geolocation
- Responsive design for all screen sizes
- Real-time weather data updates

### Database & CRUD Operations
- Full CRUD operations with PostgreSQL database
- Date range validation (start before end, max 1 year ahead)
- Location validation with coordinate support
- View all saved weather queries with full date range data
- Update existing records with inline editing
- Refetch weather data when dates are modified
- Delete records with confirmation
- Export individual queries in multiple formats (JSON, CSV, XML)
- Bulk export of all queries
- Search history with timestamps
- Daily weather data storage for entire date range
- Weather metrics persistence (temperature, humidity, wind, etc.)

### Advanced Features
- **Daily Weather Tracking**: Stores weather data for each day in the selected date range
- **Per-Query Downloads**: Download individual queries with all associated data
- **Query Modification**: Edit location and dates, then refetch updated weather
- **Comprehensive Data Export**: Each download includes current weather, forecast, and daily data
- **Visual Data Indicators**: Color-coded display showing which dates have available data
- **Auto-load on Page Load**: Automatically fetches weather for current location with default dates

## Prerequisites
- Node.js 18+
- PostgreSQL database (local installation or Supabase free tier)
- OpenWeatherMap API key (free tier available)

## Installation

### 1. Clone the repository
```bash
git clone [your-repo-url]
cd weather-app-advanced
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/weather_db"
NEXT_PUBLIC_WEATHER_API_KEY="your_openweathermap_api_key"
```

### 4. Set up the database
```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Start the development server
```bash
npm run dev
```

### 6. Open your browser
Navigate to [http://localhost:3000](http://localhost:3000)

## API Keys Setup

### OpenWeatherMap API (Required)
1. Sign up at [https://openweathermap.org/api](https://openweathermap.org/api)
2. Navigate to the "API Keys" tab in your account
3. Generate a new API key
4. Add to `.env` as `NEXT_PUBLIC_WEATHER_API_KEY`

**Note**: Free tier includes:
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- 5-day forecast

### PostgreSQL Database (Required)

#### Option 1: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a new database:
   ```sql
   CREATE DATABASE weather_db;
   ```
3. Use connection string format:
   ```
   postgresql://username:password@localhost:5432/weather_db
   ```

#### Option 2: Supabase (Recommended - Free Tier)
1. Sign up at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (Connection Pooling recommended)
5. Add to `.env` as `DATABASE_URL`

**Supabase Free Tier includes**:
- 500 MB database space
- Unlimited API requests
- Up to 50,000 monthly active users

## Project Structure

```
weather-app-advanced/
├── app/
│   ├── api/                         # Backend API routes
│   │   ├── weather/
│   │   │   ├── route.ts            # Current weather endpoint
│   │   │   ├── forecast/
│   │   │   │   └── route.ts        # 5-day forecast endpoint
│   │   │   └── date-range/
│   │   │       └── route.ts        # Date range weather endpoint
│   │   ├── queries/
│   │   │   ├── route.ts            # Create & Read all queries
│   │   │   └── [id]/
│   │   │       ├── route.ts        # Read, Update, Delete single query
│   │   │       ├── download/
│   │   │       │   └── route.ts    # Download single query
│   │   │       └── refetch/
│   │   │           └── route.ts    # Refetch weather for modified dates
│   │   ├── export/
│   │   │   └── route.ts            # Bulk export data (JSON/CSV/XML)
│   │   └── geocoding/
│   │       └── route.ts            # City auto-complete suggestions
│   ├── layout.tsx                   # Root layout with metadata
│   ├── page.tsx                     # Main application page
│   └── globals.css                  # Global styles
├── components/
│   ├── WeatherSearch.tsx            # Search with auto-complete & dates
│   ├── WeatherDisplay.tsx           # Current weather display
│   ├── ForecastDisplay.tsx          # 5-day forecast cards
│   ├── SavedQueries.tsx             # CRUD operations with download
│   └── ExportData.tsx               # Bulk export functionality
├── lib/
│   ├── prisma.ts                    # Prisma client singleton
│   └── utils.ts                     # Helper functions
├── prisma/
│   └── schema.prisma                # Database schema
├── .env.example                     # Environment variables template
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Database Schema

### WeatherQuery Model
```prisma
model WeatherQuery {
  id               String   @id @default(cuid())
  location         String                    // City name
  locationLat      Float?                    // Latitude
  locationLon      Float?                    // Longitude
  country          String?                   // Country code
  startDate        DateTime                  // Query start date
  endDate          DateTime                  // Query end date
  temperature      Float?                    // Current temperature (°C)
  feelsLike        Float?                    // Feels like temperature (°C)
  tempMin          Float?                    // Minimum temperature (°C)
  tempMax          Float?                    // Maximum temperature (°C)
  description      String?                   // Weather description
  humidity         Int?                      // Humidity percentage
  pressure         Int?                      // Atmospheric pressure (hPa)
  clouds           Int?                      // Cloudiness percentage
  windSpeed        Float?                    // Wind speed (m/s)
  icon             String?                   // Weather icon code
  forecastData     Json?                     // 5-7 day forecast data
  dailyWeatherData Json?                     // Daily weather for date range
  createdAt        DateTime @default(now())  // Record creation timestamp
  updatedAt        DateTime @updatedAt       // Record update timestamp

  @@index([location])
  @@index([createdAt])
}
```

## API Endpoints

### Weather Endpoints
- **GET** `/api/weather?location={location}` - Get current weather by location
- **GET** `/api/weather?lat={lat}&lon={lon}` - Get current weather by coordinates
- **GET** `/api/weather/forecast?location={location}` - Get 5-day forecast by location
- **GET** `/api/weather/forecast?lat={lat}&lon={lon}` - Get 5-day forecast by coordinates
- **GET** `/api/weather/date-range?location={location}&startDate={date}&endDate={date}` - Get weather for date range

### Geocoding Endpoint
- **GET** `/api/geocoding?q={query}` - Get city suggestions with coordinates

### CRUD Endpoints
- **POST** `/api/queries` - Create a new weather query with full date range data
- **GET** `/api/queries` - Get all weather queries
- **GET** `/api/queries?location={location}` - Filter queries by location
- **GET** `/api/queries?limit={number}` - Limit number of results
- **GET** `/api/queries/[id]` - Get a specific query by ID
- **PUT** `/api/queries/[id]` - Update a query by ID
- **DELETE** `/api/queries/[id]` - Delete a query by ID
- **POST** `/api/queries/[id]/refetch` - Refetch weather data with new dates

### Export Endpoints
- **GET** `/api/export?format=json` - Export all queries as JSON
- **GET** `/api/export?format=csv` - Export all queries as CSV
- **GET** `/api/export?format=xml` - Export all queries as XML
- **GET** `/api/queries/[id]/download?format=json` - Download single query as JSON
- **GET** `/api/queries/[id]/download?format=csv` - Download single query as CSV
- **GET** `/api/queries/[id]/download?format=xml` - Download single query as XML

## Using the Application

### 1. Automatic Location Detection
- On page load, the app automatically:
  - Requests your location (if permission granted)
  - Sets default dates (today + 7 days)
  - Fetches and saves weather data

### 2. Search by City Name
- Start typing a city name (e.g., "London")
- Select from auto-complete suggestions
- Weather is automatically fetched when you select a city

### 3. Search by Coordinates
- Enter "51.5074,-0.1278" (London coordinates)
- Set date range and click "Search Weather"

### 4. Use Current Location
- Click "My Location" button
- Allow browser location access when prompted

### 5. Date Range Selection
- Click "Set Dates (Today + 7 days)" for default range
- Or manually select start and end dates
- Weather data for ALL dates in range is fetched and stored

### 6. View Saved Queries
- All queries appear in the "Saved Queries" panel
- Each query shows:
  - Current weather summary
  - Daily weather for each date in the range (color-coded)
  - 5-day forecast data
  - Download buttons (JSON/CSV/XML)

### 7. Edit and Refetch
- Click the edit icon on any saved query
- Modify location or dates
- If dates changed, "Refetch Weather for New Dates" button appears
- Click to get updated weather data for the new date range

### 8. Download Individual Queries
- Each query has three download buttons:
  - **JSON**: Complete structured data
  - **CSV**: Spreadsheet-friendly format
  - **XML**: Structured markup format
- All downloads include:
  - Current weather
  - Daily weather for entire date range
  - Forecast data
  - Query metadata

### 9. Bulk Export
- Use "Export Data" panel to download all queries at once
- Choose from JSON, CSV, or XML format

## Features in Detail

### City Auto-Complete
- Real-time suggestions as you type
- Shows city name, state/region, country
- Displays coordinates for each suggestion
- Automatic search when suggestion is selected

### Date Range Weather Tracking
- Fetches weather data for every day in the selected range
- Stores daily temperature, humidity, wind, pressure, etc.
- Visual indicators show which dates have available data:
  - **Green background**: Weather data available
  - **Gray background**: Data unavailable (historical or beyond forecast)

### Query Modification & Refetch
- Edit any saved query's location and dates
- If dates change, automatically prompts to refetch weather
- Updates all weather data with fresh API calls
- Preserves query history with timestamps

### Comprehensive Data Export
Each downloaded query includes:
- **Query Information**: ID, location, coordinates, date range
- **Current Weather**: Temperature, feels like, min/max, description, humidity, pressure, wind, clouds
- **Daily Weather**: Complete weather data for each day in date range
- **Forecast**: 5-7 day forecast predictions
- **Metadata**: Creation and update timestamps

### Smart Loading States
- Automatic location detection on page load
- Loading indicators during searches
- Status messages for geolocation process
- Error handling with clear messages

## Validation Features

### Date Range Validation
- Start date must be before end date
- Dates must be valid format
- End date cannot be more than 1 year in future
- Both dates required for database storage
- Provides clear error messages

### Location Validation
- Checks if location exists via API
- Supports multiple input formats (city, zip, coordinates)
- Returns 404 for invalid locations
- Handles coordinate validation
- Auto-complete prevents invalid entries

## Error Handling
- Network error handling with user-friendly messages
- API rate limit awareness
- Database connection error handling
- Form validation feedback
- 404 handling for non-existent resources
- Geolocation permission handling
- Date range validation errors

## Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings:
   ```
   DATABASE_URL=your_production_database_url
   NEXT_PUBLIC_WEATHER_API_KEY=your_api_key
   ```
4. Deploy

## About PM Accelerator

**PM Accelerator** is a leading product management training program that helps aspiring PMs break into tech through hands-on projects and mentorship. They provide real-world experience building AI-powered products and help participants develop the skills needed to succeed in product management roles at top tech companies.

**Learn more**: [PM Accelerator on LinkedIn](https://www.linkedin.com/company/product-manager-accelerator)

## Author
**Sri Charan Reddy Bodicherla**

Built as part of the PM Accelerator AI Engineer Internship Assessment

## License
This project was created for the PM Accelerator AI Engineer Internship assessment.

---

## Troubleshooting

### Issue: Prisma Client errors
**Solution**: Run `npx prisma generate` to regenerate the client

### Issue: Database connection errors
**Solution**:
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if local)
- Verify Supabase connection string (if using Supabase)
- Run `npx prisma db push` to sync schema

### Issue: API key not working
**Solution**:
- Verify your OpenWeatherMap API key is active
- Check you've added `NEXT_PUBLIC_` prefix
- Wait 1-2 hours after generating new API key

### Issue: Location not found
**Solution**:
- Check spelling of city name
- Try using auto-complete suggestions
- Try coordinates instead
- Verify your internet connection

### Issue: Search button stuck on "Searching..."
**Solution**:
- Make sure both start and end dates are selected
- Check browser console for errors
- Verify API key is configured correctly

## Future Enhancements
- [ ] Historical weather data (requires premium API)
- [ ] Weather alerts and notifications
- [ ] User authentication and personalized dashboards
- [ ] Favorite locations
- [ ] Weather comparison between locations
- [ ] Interactive weather charts and graphs
- [ ] Dark mode support
- [ ] Email weather reports
- [ ] Mobile app version

---

**Built for PM Accelerator**
