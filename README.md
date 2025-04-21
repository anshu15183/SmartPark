
# SmartPark - Parking Management System

A complete smart parking management system with QR code-based entry/exit, real-time booking, prepaid wallet, and dynamic pricing.

## Features

- **User Authentication**: Signup, login, OTP verification, and forgot password
- **Booking System**: Book parking spots and receive QR codes
- **QR-based Entry/Exit**: Scan QR codes at entry and exit kiosks
- **Wallet System**: Prepaid wallet with auto-deduction at exit
- **Dynamic Pricing**: Base rate with time-based fine calculation
- **Special Passes**: Free parking for designated users
- **Admin Dashboard**: Manage floors, spots, and users
- **Defaulter Management**: Track unpaid dues and restrict bookings
- **Dark Mode**: Toggle between light and dark themes
- **Barrier Gate Simulation**: Real-time visualization of entry and exit barriers

## Tech Stack

- **Frontend**: React.js with Tailwind CSS and Shadcn UI
- **Backend**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **State Management**: React Context API + React Query
- **Notifications**: Toast notifications

## Special Pages and Endpoints

### User-Facing Pages
- **Home**: `/` - Landing page with main information
- **Login**: `/login` - User authentication
- **Signup**: `/signup` - New user registration
- **Dashboard**: `/dashboard` - User dashboard with booking status and wallet
- **Booking**: `/booking` - Make a new parking reservation
- **Profile**: `/profile` - User profile management

### Special Function Pages
- **Entry Kiosk**: `/kiosk/entry` - Simulates the entry gate scanner
- **Exit Kiosk**: `/kiosk/exit` - Simulates the exit gate scanner with payment processing
- **Barrier Gates**: `/barrier-gates` - Visualizes the barrier gates opening/closing
- **User-Specific Barrier**: `/barrier-gates/:userId` - User-specific barrier visualization
- **Special Pass QR**: `/qrcode/user` - QR code for special pass holders (only available to users with isSpecialPass flag)

### Admin Pages
- **Admin Dashboard**: `/admin` - Main admin control panel
- **Admin Floors**: `/admin/floors` - Manage parking floors and spots
- **Admin Bookings**: `/admin/bookings` - View and manage all bookings
- **Admin Users**: `/admin/users` - User management
- **Admin Payments**: `/admin/payments` - Payment tracking and management
- **Admin Defaulters**: `/admin/defaulters` - Track users with unpaid dues
- **Admin Special Passes**: `/admin/special-passes` - Manage users with special access
- **Admin User Roles**: `/admin/user-roles` - Manage user role assignments

## API Endpoints

The backend API is accessible at `http://localhost:5000/api` with the following main endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/verify-otp` - Verify OTP during registration
- `GET /api/auth/me` - Get the current logged-in user

### User
- `GET /api/user/profile` - Get complete user profile including bookings
- `PUT /api/user/profile` - Update user profile

### Booking
- `POST /api/booking` - Create a new booking
- `GET /api/booking/user` - Get current user's bookings
- `GET /api/booking/:id` - Get a specific booking
- `POST /api/booking/cancel/:id` - Cancel a booking

### Kiosk
- `POST /api/kiosk/entry-scan` - Process entry gate QR scan
- `POST /api/kiosk/exit-scan` - Process exit gate QR scan
- `POST /api/kiosk/complete-exit` - Complete the exit process with payment

### Payment
- `POST /api/payment/recharge` - Add funds to user wallet
- `POST /api/payment/pay-dues-wallet` - Pay dues using wallet balance

### Floor
- `GET /api/floor` - Get all floors
- `POST /api/floor` - Create a new floor (admin only)
- `PUT /api/floor/:id` - Update a floor (admin only)
- `DELETE /api/floor/:id` - Delete a floor (admin only)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/bookings` - Get all bookings (admin only)
- `PUT /api/admin/user/:id/role` - Update user role (admin only)
- `PUT /api/admin/user/:id/special-pass` - Toggle special pass for user (admin only)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB installed locally or MongoDB Atlas account
- Docker (optional, for containerized deployment)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smartpark.git
cd smartpark
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

This will start both the application and MongoDB in containers. The app will be available at http://localhost:5000.

### Manual Setup

#### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smartpark
JWT_SECRET=your_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173

# OTP Expiry time in minutes
OTP_EXPIRY=10

# Set to 'production' when deploying to cloud
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

#### Frontend Setup

1. Open a new terminal and navigate to the project root directory.

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

## Docker Deployment

### Building Your Own Docker Image

1. Make the build script executable:
```bash
chmod +x docker-build.sh
```

2. Edit the `docker-build.sh` file to change the Docker Hub username to your own.

3. Run the script to build and push the image:
```bash
./docker-build.sh
```

### Deploying to Cloud Services

#### AWS ECS

1. Create an ECS cluster (or use an existing one)
2. Create a task definition using the image `yourusername/smartpark:latest`
3. Create a service using the task definition

#### Azure Container Instances

```bash
az container create --resource-group myResourceGroup --name smartpark \
  --image yourusername/smartpark:latest --ports 5000 --dns-name-label smartpark
```

#### Oracle Cloud Infrastructure (OCI)

1. Navigate to OCI Container Instances
2. Create a new instance using the image `yourusername/smartpark:latest`
3. Expose port 5000

## Usage

1. Open your browser and navigate to `http://localhost:5000` to access the application.
2. Create an admin account by registering and then manually update the user role to "admin" in the MongoDB database:
   ```javascript
   db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})
   ```
3. Use the admin dashboard to create parking floors and spots.
4. Book parking spots and explore all the features.

## Kiosk Setup

1. Access the entry kiosk at `http://localhost:5000/kiosk/entry`
2. Access the exit kiosk at `http://localhost:5000/kiosk/exit`

## Simulation Features

### Barrier Gate Simulation
- View real-time barrier gate animations at `/barrier-gates`
- Each user has their own simulation view at `/barrier-gates/:userId`
- The barriers respond to scan events from the kiosks

### Payment Simulation
- The app uses a mock payment system
- Wallet funds can be added via the Dashboard's wallet card
- Dues can be paid using wallet funds

## License

This project is licensed under the MIT License.
