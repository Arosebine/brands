# GREAT BRANDS

The Great Brands is a company behind this backend web application that is built to manage collection of Events' booking. The application is built using Express.js, Node.js, MySQL, and Sequelize.

# Copyright (c) 2024, GREAT BRANDS. All rights reserved.

# Developed by: Engr. Ebine Arowolo Seyi

# The Stack Used in this Project:

1. Express.js
2. Node.js
3. MySQL
4. Sequelize
5. Postman
6. RateLimiter
7. Bcrypt
8. jwt
9. Winston and Morgan

# To run this project, you need to install all the dependencies and run the following commands:

npm install

npm run dev

npm test

# Documentation:

The documentation for this task is at:[great brands link](https://documenter.getpostman.com/view/18447128/2sAXxMfZ1c)


# Brief Explanation of My Design Choices

1. # Modular Architecture
`Reasoning:` Modularity enables the application to be scalable, maintainable, and flexible for future changes. By separating features into different modules (e.g., user management, event management, bookings), each module can be developed, tested, and maintained independently.
#
`Choice:` I ensured that app is structured with separate controllers, models, and routes for each entity (e.g., User, Event, Booking). This division makes the system more organized, reduces code coupling, and makes it easier to debug or extend specific parts of the application without affecting others.

2. # Middleware for Reusability
`Reasoning:` Middleware is used for cross-cutting concerns like authentication, rate limiting, error handling, and validation. By centralizing these concerns into middleware, they can be applied consistently across different routes, reducing code duplication.
#
`Choice:` I ensured that the rate-limiting middleware (limiter) and authentication (isAuth) are reusable across different routes. This makes it easier to apply or adjust them as needed, promoting flexibility and code reuse.

3. # Asynchronous Programming with Transactions
`Reasoning:` Asynchronous behavior is essential for handling large-scale applications that require non-blocking operations, especially for I/O tasks like database queries or external API requests. Using transactions ensures database consistency in multi-step operations. Especially, in high-stakes operations like booking tickets, it's crucial that either all steps complete successfully, or none do. This prevents situations where a user’s booking might partially complete, leading to inconsistency in data.
#
`Choice:` I use async/await with Sequelize transactions, especially in critical sections like booking tickets or canceling bookings. This ensures that either the entire process completes successfully, or it rolls back, preventing partial updates that can lead to data corruption.

4. # Error Handling and Validation
`Reasoning:` Effective error handling and validation prevent unexpected crashes and ensure a smooth user experience. Consistently structured error messages help with debugging and ensure transparency for users.
#
`Choice:` I ensure that every endpoint is wrapped in try-catch blocks with clear error responses. Input validation is done at the start of each controller function, ensuring that the request body contains valid data before any database or business logic is executed. This approach prevents unnecessary database queries and reduces the chance of errors propagating.

5. # User Roles and Permissions
`Reasoning:` Role-based access control (RBAC) is essential for protecting sensitive actions. Different user roles (e.g., user, admin) should have different levels of access to prevent unauthorized users from performing administrative tasks.
#
`Choice:` So, i ensure that the app checks the user’s role (e.g., user, admin) before executing certain actions like creating an event or booking tickets. This ensures that only authorized users can perform these operations.

6. # Rate Limiting
`Reasoning:` Rate limiting is implemented to protect the entire app from abuse, especially on routes susceptible to high traffic, such as login, registration, and booking. This prevents overloading the server and guards against brute-force attacks.
#
`Choice:` So, I ensured that a global rate-limiting middleware is applied, limiting the number of requests per hour to prevent abuse while still ensuring smooth operation for regular users.

7. # Email Notifications
`Reasoning:` Email notifications are used to provide users with updates, such as successful event creation, booking confirmations, or booking cancellations. This enhances user engagement and transparency.
#
`Choice:` So, I implemented this email notification for whenever critical actions occur (e.g., ticket booked, booking canceled, event created), an email is triggered. This enhances the user experience and keeps users informed about their actions in the system.

8. # Scalable Design
`Reasoning:` The app is designed to grow as business needs evolve. It should be easy to add new features (e.g., new booking options, different event types) without needing to refactor large parts of the system.
#
`Choice:` I choose the modular structure to allow the application to scale by adding new routes, controllers, and models without impacting existing functionality. The use of Sequelize ORM provides a flexible database management layer, making it easier to evolve the data model over time.

9. # Testability
`Reasoning:` Testing is crucial to ensure the app behaves as expected and can handle edge cases. Modular code is easier to test in isolation.
#
`Choice:` I designed each functions to be testable in isolation. Controllers handle requests and logics that interact with the database or other modules, making it easy to mock and test them independently.

10. # Logging and Monitoring
`Reasoning:` Logging and monitoring are essential for debugging and understanding the app's behavior. It helps identify issues and track performance.
#
`Choice:` I used Winston with morgan to log important events, errors, and performance metrics. This information can be used for debugging, performance optimization, and monitoring the health of the application.


# Admin Login Credentials
Email: arowo@yopmail.com
Password: Seyico09@

# User Login Credentials
Email: seunkun@yopmail.com
Password: Seyico09@

Email: kingsley@yopmail.com
Password: Seyico09@