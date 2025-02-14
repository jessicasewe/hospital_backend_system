# Hospital Backend System

## Overview

This project is a backend system for a hospital that handles user signups, patient-doctor assignments, doctor note submissions, and dynamic scheduling of actionable steps based on live LLM (Large Language Model) processing. The system ensures secure handling of sensitive data and uses a live LLM to extract actionable steps from doctor notes. These steps are divided into a checklist (immediate tasks) and a plan (scheduled actions). New note submissions cancel any existing actionable steps and create new ones.

## Features

1. **User Management**
   - **Signup Endpoint**: Register users with Name, Email, and Password. Users can sign up as either a Patient or a Doctor.
   - **Authentication & Security**: Uses JWT (JSON Web Tokens) for authentication. Passwords are securely hashed using bcrypt, and sensitive data is encrypted.

2. **Patient-Doctor Assignment**
   - **Doctor Selection**: Patients must choose from a list of available doctors after signup.
   - **Doctor View**: Doctors can see a list of patients who have selected them.

3. **Doctor Notes & Actionable Steps**
   - **Note Submission**: Doctors can select a patient and submit notes.
   - **LLM Integration**: Uses a live LLM (e.g., Google Gemini Flash) to extract actionable steps:
     - **Checklist**: Immediate one-time tasks (e.g., buy a drug).
     - **Plan**: A schedule of actions (e.g., daily reminders to take the drug for 7 days).
   - **Dynamic Scheduling**: Schedules reminders based on the plan. Reminders repeat until a patient checks in, then proceed to the next one.

4. **API Endpoints**
   - User signup and authentication.
   - Patient doctor selection.
   - Doctor retrieval of their patient list.
   - Submitting doctor notes and processing actionable steps.
   - Retrieving actionable steps and reminders.

## Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (or a MongoDB Atlas connection string)
- Google Gemini API Key (for LLM integration)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/hospital-backend.git
   cd hospital-backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

   Create a `.env` file in the root directory and add the following variables:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hospital
   JWT_SECRET=your_jwt_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ENCRYPTION_KEY=your_encryption_key
   GOOGLE_API_KEY=your_google_api_key
   ```

4. **Run the Application**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`.

## API Documentation

### User Management

- **POST /api/users/register**: Register a new user.
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "Password123!",
    "role": "patient"
  }
  ```

- **POST /api/users/login**: Login a user.
  ```json
  {
    "email": "john.doe@example.com",
    "password": "Password123!"
  }
  ```

- **POST /api/users/refresh-token**: Refresh the access token.
  ```json
  {
    "refreshToken": "your_refresh_token"
  }
  ```

- **POST /api/users/logout**: Logout a user.
  ```json
  {
    "refreshToken": "your_refresh_token"
  }
  ```

### Doctor Notes

- **POST /api/submit-note**: Submit a doctor's note.
  ```json
  {
    "patientId": "patient_id",
    "note": "Patient needs to take Amoxicillin 500mg twice daily for 7 days."
  }
  ```

- **GET /api/notes/:patientId**: Get all notes for a patient.
  ```bash
  GET /api/notes/patient_id
  ```

- **GET /api/actionable-steps/:patientId**: Get actionable steps for a patient.
  ```bash
  GET /api/actionable-steps/patient_id
  ```

### Reminders

- **GET /api/reminders/:patientId**: Get all reminders for a patient.
  ```bash
  GET /api/reminders/patient_id
  ```

- **PUT /api/reminders/:reminderId/complete**: Mark a reminder as completed.
  ```bash
  PUT /api/reminders/reminder_id/complete
  ```

- **PUT /api/reminders/:reminderId/reschedule**: Reschedule a reminder.
  ```json
  {
    "newDate": "2023-12-31T09:00:00Z"
  }
  ```

## Testing

To run the tests, use the following command:

```bash
npm test
```

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Express.js**: Web framework for building the API.
- **MongoDB**: Database for storing user data, notes, and reminders.
- **JWT**: For secure authentication.
- **Google Gemini**: For extracting actionable steps from doctor notes.
- **Jest & Supertest**: For testing the API.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeatureName`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeatureName`).
5. Open a Pull Request.


## For any questions or feedback, please reach out to:

Jessica Sewe Guriyire - jessicasewe89@gmail.com
GitHub: jessicasewe

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
