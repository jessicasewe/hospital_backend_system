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

# Design Decisions  

Here’s a breakdown of why I made certain design choices for the **Hospital Backend System**—focused on security, scalability, and making life easier for both patients and doctors.  

---

## **1. Authentication**  
### Why JWT?  
- **No Session Storage Hassle** – JWTs are stateless, so the server doesn’t need to store session data.  
- **Security First** – Tokens are signed with `JWT_SECRET`, making them tamper-proof.  
- **Short-Lived for Safety** – Access tokens expire in 1 hour, refresh tokens in 7 days to limit risk.  

### How it works:  
1. User logs in → gets an **access & refresh token**.  
2. The access token handles API requests.  
3. When it expires, the refresh token gets a new one—no need to log in again.  

---

## **2. Encryption**  
### Why AES-256-CBC?  
- **Privacy is Non-Negotiable** – Medical data is sensitive. Encryption ensures only the right people can read it.  
- **Even if the DB is Hacked, It's Useless** – Without the key, the data is unreadable.  

### How it works:  
- Doctor notes are encrypted using **AES-256-CBC**.  
- Each patient-doctor pair has a unique key, derived from their IDs and a master key (`ENCRYPTION_KEY`).  
- That key **is never stored** in the database—only authorized users can decrypt.  

---

## **3. Scheduling Strategy**  
### Why Dynamic Scheduling?  
- **Patients Forget, The System Doesn’t** – If someone misses a reminder, it adjusts the schedule.  
- **Automates Everything** – No manual tracking needed.  

### How it works:  
- Google Gemini extracts a **Checklist & Plan** from doctor notes.  
- **Checklist** = Immediate actions (e.g., buy meds).  
- **Plan** = Scheduled tasks (e.g., take meds daily for 7 days).  
- **node-cron** schedules reminders, which are stored in the database.  

---

## **4. Data Storage**  
### Why MongoDB?  
- **Schema-less = Flexibility** – Can easily store different types of medical data.  
- **Scalable** – Handles large hospital systems with ease.  
- **Fast Reads & Writes** – Important for real-time access to patient records.  

### Collections:  
- **Users** – Stores patient/doctor info.  
- **Doctor Notes** – Stores encrypted notes.  
- **Reminders** – Manages scheduled actions.  

---

## **5. LLM Integration**  
### Why Google Gemini?  
- **Accuracy** – Parses unstructured doctor notes and extracts real tasks.  
- **Easy to Work With** – API is simple to integrate and gives consistent results.  

### How it works:  
1. Doctor notes are sent to Gemini.  
2. It returns **Checklist & Plan** in JSON format.  
3. The system processes this and schedules tasks accordingly.  

---

## **6. Logging**  
### Why Winston?  
- **Structured & Searchable Logs** – Helps with debugging.  
- **Multiple Outputs** – Can log to console, files, or external tools.  

### How it works:  
- Logs are stored in the `logs/` folder.  
- Two main logs:  
  - `cron.log` → Tracks scheduled jobs.  
  - `error.log` → Captures errors for debugging.  

---

## **7. Error Handling**  
### Why Centralized Error Handling?  
- **Consistent Error Responses** – Clients get clear, standard messages.  
- **No Leaking Sensitive Info** – API only returns necessary details.  

### How it works:  
- All errors are logged using Winston.  
- API sends a simple response (e.g., “Something went wrong”), while detailed logs go to the server.  

---

## **8. API Design**  
### Why RESTful API?  
- **Simple & Clean** – Easy to use and expand.  
- **Works on Any Platform** – Web, mobile, or third-party integrations.  

### How it works:  
- **POST** – Creating resources (register, login, submit note).  
- **GET** – Retrieving data (notes, reminders).  
- **PUT** – Updating data (marking reminders complete).  

---

## **9. Security**  
### Why bcrypt for Passwords?  
- **Standard for Secure Hashing** – Resistant to brute-force attacks.  
- **Built-in Salting** – Adds an extra layer of protection.  

### How it works:  
- Passwords are hashed with bcrypt before being stored.  
- Salt rounds set to 10 for optimal security vs. performance.  

---

## **10. Testing**
### How it works:  
- Integration tests for API endpoints.  


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
