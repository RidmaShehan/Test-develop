# Microservices Migration Plan: Node.js to Spring Boot

## Executive Summary

This document provides a comprehensive migration strategy for converting the Education CRM System from a Node.js/Next.js monolithic architecture to a Spring Boot microservices-based architecture. The system currently manages student inquiries, campaigns, tasks, projects, communications, and reporting for educational institutions.

**Current Stack:**
- Frontend: Next.js 15, React 18, TypeScript
- Backend: Next.js API Routes, Node.js
- Database: SQLite (dev), PostgreSQL (production)
- ORM: Prisma
- Authentication: JWT with HTTP-only cookies
- External APIs: AWS S3, Ultramsg (WhatsApp), Gmail API

**Target Stack:**
- Microservices: Spring Boot 3.x, Java 17+
- API Gateway: Spring Cloud Gateway
- Service Discovery: Eureka/Consul
- Database: PostgreSQL (per service)
- ORM: Spring Data JPA
- Authentication: Spring Security with JWT
- Messaging: RabbitMQ/Kafka
- Container: Docker, Kubernetes

---

## 1. Current Monolithic Architecture Analysis

### 1.1 Application Structure

**Frontend (Next.js App Router):**
```
src/app/
├── api/              # 59 API route handlers
├── dashboard/        # Dashboard UI
├── inquiries/       # Student inquiry management
├── campaigns/        # Marketing campaigns
├── tasks/            # Task management (Kanban)
├── projects/         # Project management
├── users/            # User management
├── meetings/         # Meeting scheduling
├── posts/            # Social media post approval
└── reports/          # Reporting & analytics
```

**Backend API Routes (59 endpoints):**
- Authentication: `/api/auth/*` (login, logout, me)
- Users: `/api/users/*` (CRUD, role management)
- Seekers/Inquiries: `/api/inquiries/*`, `/api/seekers/*`
- Campaigns: `/api/campaigns/*`, `/api/campaign-types/*`
- Tasks: `/api/tasks/*`, `/api/tasks/enhanced/*`
- Projects: `/api/projects/*`
- Deals: `/api/deals/*`
- Clients: `/api/clients/*`
- Meetings: `/api/meetings/*`
- Posts: `/api/posts/*` (approval workflow)
- Notifications: `/api/notifications/*`
- Reports: `/api/reports/*`, `/api/reports/annual/*`
- Email: `/api/email/bulk-send/*`, `/api/email/history/*`
- WhatsApp: `/api/whatsapp/bulk-send/*`, `/api/whatsapp/history/*`
- Activity Logs: `/api/user-activity/*`
- System Settings: `/api/system-settings/*`

### 1.2 Database Schema Analysis

**Core Models (30+ entities):**
1. **User Management Domain:**
   - User, Role, PermissionModel, UserRoleAssignment, RolePermission

2. **Inquiry/Seeker Domain:**
   - Seeker, Interaction, FollowUpTask, TaskActionHistory, Assignment
   - SeekerProgram (many-to-many with Program)

3. **Campaign Domain:**
   - Campaign, CampaignType, CampaignSeeker

4. **Program Management:**
   - Program, Level

5. **Task Management:**
   - Task, TaskChecklist, TaskAttachment, TaskComment, TaskTimeEntry

6. **Project Management:**
   - Project, ProjectMember, Deal, DealActivity, Client

7. **Communication:**
   - WhatsAppMessage, WhatsAppRecipient, EmailMessage, EmailRecipient, EmailAttachment

8. **Meetings:**
   - Meeting

9. **Post Approval:**
   - SocialMediaPost, PostApproval, PostComment

10. **System:**
    - UserActivityLog, SystemSettings, Notification

**Database Relationships:**
- User → Many relationships (seekers, tasks, campaigns, etc.)
- Seeker → Campaigns, Programs, Interactions, Tasks
- Campaign → Seekers, SocialMediaPosts
- Project → Tasks, Deals, Members

### 1.3 External Dependencies

1. **AWS S3** (`@aws-sdk/client-s3`)
   - File uploads for campaigns, WhatsApp media
   - Fallback to local storage

2. **Ultramsg API** (WhatsApp)
   - Bulk messaging
   - Media messages (image, video, audio, document)

3. **Gmail API**
   - Bulk email sending
   - Email attachments

4. **Upstash Redis** (`@upstash/redis`)
   - Caching (if implemented)

5. **Prisma ORM**
   - Database abstraction layer

### 1.4 Authentication & Authorization

**Current Implementation:**
- JWT tokens stored in HTTP-only cookies
- Role-based access control (RBAC)
- 5 roles: ADMINISTRATOR, ADMIN, DEVELOPER, COORDINATOR, VIEWER
- 43 granular permissions
- Middleware-based route protection

**Key Functions:**
- `requireAuth()` - Validates JWT token
- `requireRole()` - Validates specific role
- `hasPermission()` - Checks granular permissions

### 1.5 Business Domains Identified

Based on DDD principles, the following bounded contexts exist:

1. **Identity & Access Management**
   - User authentication, authorization, roles, permissions

2. **Inquiry Management**
   - Student inquiries, interactions, assignments, follow-ups

3. **Campaign Management**
   - Marketing campaigns, campaign types, analytics

4. **Program Management**
   - Educational programs, levels, campuses

5. **Task Management**
   - Follow-up tasks, enhanced tasks (Kanban), time tracking

6. **Project Management**
   - Projects, deals, clients, project members

7. **Communication Services**
   - WhatsApp messaging, Email campaigns

8. **Meeting Management**
   - Meeting scheduling, calendar integration

9. **Content Approval**
   - Social media post approval workflow

10. **Reporting & Analytics**
    - Reports, activity logs, dashboards

11. **Notification Service**
    - Real-time notifications, activity feeds

---

## 2. Microservices Decomposition Strategy

### 2.1 Proposed Microservices

Following Domain-Driven Design and bounded context principles:

#### **1. API Gateway Service** (Spring Cloud Gateway)
- **Responsibility:** Single entry point, routing, authentication, rate limiting
- **Technology:** Spring Cloud Gateway
- **Port:** 8080

#### **2. Authentication Service** (`auth-service`)
- **Responsibility:** User authentication, JWT token generation/validation, password management
- **Database:** `auth_db` (PostgreSQL)
- **Entities:** User, Role, Permission, UserRoleAssignment
- **Port:** 8081
- **APIs:**
  - POST `/auth/login`
  - POST `/auth/logout`
  - GET `/auth/me`
  - POST `/auth/refresh`
  - POST `/auth/validate-token`

#### **3. User Management Service** (`user-service`)
- **Responsibility:** User CRUD, role management, permission management
- **Database:** `user_db` (PostgreSQL) - shares auth_db or separate
- **Entities:** User, Role, Permission, UserRoleAssignment, RolePermission
- **Port:** 8082
- **APIs:**
  - GET/POST/PUT/DELETE `/users/*`
  - GET/POST/PUT/DELETE `/roles/*`
  - GET `/permissions`

#### **4. Inquiry Management Service** (`inquiry-service`)
- **Responsibility:** Student inquiries, interactions, assignments
- **Database:** `inquiry_db` (PostgreSQL)
- **Entities:** Seeker, Interaction, Assignment, FollowUpTask, TaskActionHistory
- **Port:** 8083
- **APIs:**
  - GET/POST/PUT/DELETE `/inquiries/*`
  - POST `/inquiries/{id}/interactions`
  - GET/POST `/inquiries/{id}/tasks`

#### **5. Campaign Service** (`campaign-service`)
- **Responsibility:** Marketing campaigns, campaign types, campaign analytics
- **Database:** `campaign_db` (PostgreSQL)
- **Entities:** Campaign, CampaignType, CampaignSeeker
- **Port:** 8084
- **APIs:**
  - GET/POST/PUT/DELETE `/campaigns/*`
  - GET/POST/PUT/DELETE `/campaign-types/*`
  - GET `/campaigns/{id}/analytics`
  - POST `/campaigns/{id}/export`

#### **6. Program Service** (`program-service`)
- **Responsibility:** Educational programs, levels, campuses
- **Database:** `program_db` (PostgreSQL)
- **Entities:** Program, Level, SeekerProgram
- **Port:** 8085
- **APIs:**
  - GET/POST/PUT/DELETE `/programs/*`
  - GET/POST/PUT/DELETE `/levels/*`

#### **7. Task Management Service** (`task-service`)
- **Responsibility:** Task management (Kanban), follow-ups, time tracking
- **Database:** `task_db` (PostgreSQL)
- **Entities:** Task, TaskChecklist, TaskAttachment, TaskComment, TaskTimeEntry, FollowUpTask
- **Port:** 8086
- **APIs:**
  - GET/POST/PUT/DELETE `/tasks/*`
  - GET/POST `/tasks/enhanced/*`
  - GET `/tasks/kanban`

#### **8. Project Management Service** (`project-service`)
- **Responsibility:** Projects, deals, clients, project members
- **Database:** `project_db` (PostgreSQL)
- **Entities:** Project, ProjectMember, Deal, DealActivity, Client
- **Port:** 8087
- **APIs:**
  - GET/POST/PUT/DELETE `/projects/*`
  - GET/POST/PUT/DELETE `/deals/*`
  - GET/POST/PUT/DELETE `/clients/*`

#### **9. Communication Service** (`communication-service`)
- **Responsibility:** WhatsApp and Email messaging
- **Database:** `communication_db` (PostgreSQL)
- **Entities:** WhatsAppMessage, WhatsAppRecipient, EmailMessage, EmailRecipient, EmailAttachment
- **Port:** 8088
- **APIs:**
  - POST `/whatsapp/bulk-send`
  - GET `/whatsapp/history`
  - POST `/email/bulk-send`
  - GET `/email/history`

#### **10. Meeting Service** (`meeting-service`)
- **Responsibility:** Meeting scheduling, calendar integration
- **Database:** `meeting_db` (PostgreSQL)
- **Entities:** Meeting
- **Port:** 8089
- **APIs:**
  - GET/POST/PUT/DELETE `/meetings/*`
  - GET `/meetings/calendar`

#### **11. Content Approval Service** (`content-service`)
- **Responsibility:** Social media post approval workflow
- **Database:** `content_db` (PostgreSQL)
- **Entities:** SocialMediaPost, PostApproval, PostComment
- **Port:** 8090
- **APIs:**
  - GET/POST/PUT/DELETE `/posts/*`
  - POST `/posts/{id}/approve`
  - POST `/posts/{id}/reject`
  - GET `/posts/pending`

#### **12. Notification Service** (`notification-service`)
- **Responsibility:** Real-time notifications, activity feeds
- **Database:** `notification_db` (PostgreSQL)
- **Entities:** Notification
- **Port:** 8091
- **APIs:**
  - GET `/notifications`
  - PUT `/notifications/{id}/read`
  - PUT `/notifications/read-all`
  - GET `/notifications/unread-count`

#### **13. Reporting Service** (`reporting-service`)
- **Responsibility:** Reports, analytics, exports
- **Database:** Read from multiple services (aggregation)
- **Port:** 8092
- **APIs:**
  - GET `/reports`
  - GET `/reports/annual`
  - POST `/reports/export`
  - GET `/dashboard`

#### **14. Activity Logging Service** (`activity-service`)
- **Responsibility:** User activity logging, audit trails
- **Database:** `activity_db` (PostgreSQL)
- **Entities:** UserActivityLog
- **Port:** 8093
- **APIs:**
  - GET `/user-activity`
  - POST `/user-activity/export`

#### **15. System Settings Service** (`settings-service`)
- **Responsibility:** System configuration, settings
- **Database:** `settings_db` (PostgreSQL)
- **Entities:** SystemSettings
- **Port:** 8094
- **APIs:**
  - GET/PUT `/system-settings/*`

### 2.2 Service Communication Patterns

#### **Synchronous Communication (REST)**
- **Use Cases:**
  - User validation from auth-service
  - Real-time data fetching
  - Immediate responses required
- **Implementation:** Spring WebClient, Feign Client
- **Example:** Inquiry service calls user-service to validate user permissions

#### **Asynchronous Communication (Messaging)**
- **Use Cases:**
  - Notification delivery
  - Activity logging
  - Email/WhatsApp sending (background jobs)
  - Post approval workflow events
- **Implementation:** RabbitMQ or Apache Kafka
- **Message Types:**
  - `user.created` - User created event
  - `inquiry.created` - New inquiry event
  - `task.assigned` - Task assignment event
  - `post.approved` - Post approval event
  - `notification.send` - Notification event

#### **Event-Driven Architecture**
- **Event Bus:** RabbitMQ Exchange or Kafka Topics
- **Event Types:**
  - Domain Events (e.g., `InquiryCreated`, `TaskCompleted`)
  - Integration Events (e.g., `EmailSent`, `WhatsAppDelivered`)

### 2.3 Database Strategy

#### **Database per Service Pattern**
Each microservice owns its database:
- **auth-service** → `auth_db`
- **inquiry-service** → `inquiry_db`
- **campaign-service** → `campaign_db`
- etc.

#### **Shared Database (Anti-pattern to avoid)**
- Only for read-only reporting/analytics aggregation
- Reporting service can read from multiple databases

#### **Data Consistency**
- **Saga Pattern** for distributed transactions
- **Eventual Consistency** for cross-service data
- **CQRS** for read/write separation (optional, for reporting)

---

## 3. Spring Boot Migration Strategy

### 3.1 Project Structure Template

For each microservice:

```
service-name/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/crm/service-name/
│   │   │       ├── ServiceNameApplication.java
│   │   │       ├── config/
│   │   │       │   ├── SecurityConfig.java
│   │   │       │   ├── WebClientConfig.java
│   │   │       │   └── RabbitMQConfig.java
│   │   │       ├── controller/
│   │   │       │   └── *Controller.java
│   │   │       ├── service/
│   │   │       │   └── *Service.java
│   │   │       ├── repository/
│   │   │       │   └── *Repository.java
│   │   │       ├── model/
│   │   │       │   ├── entity/
│   │   │       │   └── dto/
│   │   │       ├── exception/
│   │   │       │   └── GlobalExceptionHandler.java
│   │   │       └── messaging/
│   │   │           └── *EventPublisher.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-dev.yml
│   └── test/
├── pom.xml (or build.gradle)
├── Dockerfile
└── docker-compose.yml
```

### 3.2 Dependencies (pom.xml)

**Common Dependencies for All Services:**

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- Spring Cloud OpenFeign (for service-to-service calls) -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
    
    <!-- Resilience4j (Circuit Breaker) -->
    <dependency>
        <groupId>io.github.resilience4j</groupId>
        <artifactId>resilience4j-spring-boot3</artifactId>
    </dependency>
    
    <!-- RabbitMQ (if using) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-amqp</artifactId>
    </dependency>
    
    <!-- Actuator (Monitoring) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    
    <!-- Micrometer Prometheus -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
</dependencies>
```

**API Gateway Specific:**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

**Service Discovery:**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### 3.3 Configuration (application.yml)

**Example: inquiry-service**

```yaml
server:
  port: 8083

spring:
  application:
    name: inquiry-service
  
  datasource:
    url: jdbc:postgresql://localhost:5432/inquiry_db
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASS:guest}

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/

jwt:
  secret: ${JWT_SECRET:your-secret-key-change-in-production}
  expiration: 604800000 # 7 days in milliseconds

auth-service:
  url: http://auth-service:8081

logging:
  level:
    com.crm: DEBUG
    org.springframework.web: INFO
```

### 3.4 Code Translation Examples

#### **Express Route → Spring MVC Controller**

**Node.js (Next.js API Route):**
```typescript
// src/app/api/inquiries/route.ts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const inquiries = await prisma.seeker.findMany({
      where: { /* filters */ }
    })
    return NextResponse.json(inquiries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**Spring Boot Controller:**
```java
// InquiryController.java
@RestController
@RequestMapping("/inquiries")
@RequiredArgsConstructor
public class InquiryController {
    
    private final InquiryService inquiryService;
    private final AuthService authService;
    
    @GetMapping
    public ResponseEntity<List<InquiryDTO>> getAllInquiries(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        // Validate token
        User user = authService.validateToken(token);
        
        // Get inquiries
        List<InquiryDTO> inquiries = inquiryService.getAllInquiries(user, status, page, limit);
        
        return ResponseEntity.ok(inquiries);
    }
}
```

#### **Middleware → Spring Filter/Interceptor**

**Node.js Middleware:**
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.redirect('/sign-in')
  }
  // Verify token...
  return NextResponse.next()
}
```

**Spring Security Filter:**
```java
// JwtAuthenticationFilter.java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider tokenProvider;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        String token = getTokenFromRequest(request);
        
        if (token != null && tokenProvider.validateToken(token)) {
            Authentication auth = tokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

#### **Async/Await → CompletableFuture**

**Node.js:**
```typescript
async function sendBulkWhatsApp(seekers: Seeker[], message: string) {
  const results = []
  for (const seeker of seekers) {
    const result = await sendWhatsAppMessage(seeker.phone, message)
    results.push(result)
  }
  return results
}
```

**Spring Boot (CompletableFuture):**
```java
@Service
public class WhatsAppService {
    
    public CompletableFuture<List<SendResult>> sendBulkWhatsApp(
            List<Seeker> seekers, 
            String message
    ) {
        List<CompletableFuture<SendResult>> futures = seekers.stream()
            .map(seeker -> sendWhatsAppMessageAsync(seeker.getPhone(), message))
            .collect(Collectors.toList());
        
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList()));
    }
    
    private CompletableFuture<SendResult> sendWhatsAppMessageAsync(
            String phone, 
            String message
    ) {
        return CompletableFuture.supplyAsync(() -> {
            // Send WhatsApp message
            return sendWhatsAppMessage(phone, message);
        });
    }
}
```

#### **Error Handling**

**Node.js:**
```typescript
try {
  const user = await requireAuth(request)
} catch (error) {
  return NextResponse.json({ error: error.message }, { status: 401 })
}
```

**Spring Boot:**
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        ErrorResponse error = new ErrorResponse("UNAUTHORIZED", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("NOT_FOUND", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

### 3.5 Authentication & Authorization Strategy

#### **JWT Implementation**

```java
// JwtTokenProvider.java
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration}")
    private long expiration;
    
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
            .setSubject(user.getId())
            .claim("email", user.getEmail())
            .claim("role", user.getRole())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, secret)
            .compact();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
    
    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .setSigningKey(secret)
            .parseClaimsJws(token)
            .getBody();
        return claims.getSubject();
    }
}
```

#### **Spring Security Configuration**

```java
// SecurityConfig.java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

#### **Permission-Based Authorization**

```java
// @PreAuthorize annotation
@GetMapping("/users")
@PreAuthorize("hasAuthority('READ_USER')")
public ResponseEntity<List<UserDTO>> getAllUsers() {
    // ...
}

// Custom Permission Evaluator
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {
    
    @Override
    public boolean hasPermission(
            Authentication auth, 
            Object targetDomainObject, 
            Object permission
    ) {
        User user = (User) auth.getPrincipal();
        return user.getPermissions().contains(permission.toString());
    }
}
```

---

## 4. Data Migration Plan

### 4.1 Database Migration Strategy

#### **Phase 1: Schema Migration**

1. **Export Prisma Schema to SQL:**
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql
   ```

2. **Convert to PostgreSQL:**
   - SQLite → PostgreSQL conversion
   - Update data types (TEXT → VARCHAR, INTEGER → BIGINT, etc.)
   - Handle enum types (create custom types in PostgreSQL)

3. **Create Service-Specific Schemas:**
   - Split monolithic schema into service schemas
   - Maintain foreign key relationships where needed
   - Use database views for cross-service reads (if needed)

#### **Phase 2: Data Migration**

**Option A: Big Bang Migration**
- Export all data from SQLite
- Transform and import into PostgreSQL databases
- **Pros:** Clean cutover
- **Cons:** Downtime required

**Option B: Strangler Fig Pattern**
- Run both systems in parallel
- Gradually migrate data
- **Pros:** Zero downtime
- **Cons:** More complex, requires dual-write

#### **Phase 3: Data Synchronization**

**During Migration:**
1. **Dual Write Pattern:**
   - Write to both old (SQLite) and new (PostgreSQL) databases
   - Verify data consistency

2. **Read from New System:**
   - Gradually route reads to new system
   - Monitor for discrepancies

3. **Cutover:**
   - Stop writes to old system
   - Final data sync
   - Switch all traffic to new system

### 4.2 Distributed Transaction Handling

#### **Saga Pattern Implementation**

**Example: Creating an Inquiry with Task Assignment**

```java
// Saga Orchestrator
@Component
public class InquiryCreationSaga {
    
    private final InquiryService inquiryService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    
    @SagaOrchestrationStart
    public void createInquiryWithTask(InquiryCreationCommand command) {
        // Step 1: Create Inquiry
        Inquiry inquiry = inquiryService.create(command.getInquiryData());
        
        // Step 2: Create Task (compensate if fails)
        try {
            taskService.createFollowUpTask(inquiry.getId());
        } catch (Exception e) {
            // Compensate: Delete inquiry
            inquiryService.delete(inquiry.getId());
            throw e;
        }
        
        // Step 3: Send Notification (can fail without compensation)
        try {
            notificationService.sendInquiryCreatedNotification(inquiry.getId());
        } catch (Exception e) {
            // Log but don't fail the saga
            log.error("Notification failed", e);
        }
    }
}
```

#### **Event Sourcing (Optional)**

For audit trails and event replay:
- Store all domain events
- Rebuild state from events
- Useful for activity logging service

### 4.3 Caching Strategy

#### **Redis Integration**

```java
// Cache Configuration
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(
            new RedisStandaloneConfiguration("localhost", 6379)
        );
    }
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }
}

// Usage
@Service
public class InquiryService {
    
    @Cacheable(value = "inquiries", key = "#id")
    public InquiryDTO getInquiry(String id) {
        return inquiryRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found"));
    }
    
    @CacheEvict(value = "inquiries", key = "#inquiry.id")
    public InquiryDTO updateInquiry(Inquiry inquiry) {
        // Update logic
    }
}
```

---

## 5. Infrastructure & DevOps

### 5.1 API Gateway (Spring Cloud Gateway)

**Configuration:**
```yaml
# application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**
          filters:
            - StripPrefix=1
        
        - id: inquiry-service
          uri: lb://inquiry-service
          predicates:
            - Path=/api/inquiries/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
        
        - id: campaign-service
          uri: lb://campaign-service
          predicates:
            - Path=/api/campaigns/**
          filters:
            - StripPrefix=1
```

**JWT Validation Filter:**
```java
@Component
public class JwtAuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<JwtAuthenticationGatewayFilterFactory.Config> {
    
    private final JwtTokenProvider tokenProvider;
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String token = getTokenFromRequest(request);
            
            if (token == null || !tokenProvider.validateToken(token)) {
                return unauthorized(exchange);
            }
            
            // Add user info to headers
            String userId = tokenProvider.getUserIdFromToken(token);
            ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-Id", userId)
                .build();
            
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        };
    }
}
```

### 5.2 Service Discovery (Eureka)

**Eureka Server:**
```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

**Eureka Client (in each service):**
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true
```

### 5.3 Configuration Management (Spring Cloud Config)

**Config Server:**
```yaml
# application.yml (Config Server)
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/your-org/config-repo
          search-paths: '{application}'
```

**Config Client (in each service):**
```yaml
spring:
  cloud:
    config:
      uri: http://config-server:8888
      name: inquiry-service
      profile: ${SPRING_PROFILES_ACTIVE:dev}
```

### 5.4 Container Orchestration

#### **Dockerfile Example**

```dockerfile
# Dockerfile for inquiry-service
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/inquiry-service-1.0.0.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### **Docker Compose (Development)**

```yaml
version: '3.8'

services:
  postgres-auth:
    image: postgres:15
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - auth-data:/var/lib/postgresql/data
  
  postgres-inquiry:
    image: postgres:15
    environment:
      POSTGRES_DB: inquiry_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - inquiry-data:/var/lib/postgresql/data
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  eureka-server:
    build: ./eureka-server
    ports:
      - "8761:8761"
  
  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    depends_on:
      - eureka-server
  
  auth-service:
    build: ./auth-service
    ports:
      - "8081:8081"
    depends_on:
      - postgres-auth
      - eureka-server
  
  inquiry-service:
    build: ./inquiry-service
    ports:
      - "8083:8083"
    depends_on:
      - postgres-inquiry
      - eureka-server
      - auth-service

volumes:
  auth-data:
  inquiry-data:
```

#### **Kubernetes Deployment**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inquiry-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inquiry-service
  template:
    metadata:
      labels:
        app: inquiry-service
    spec:
      containers:
      - name: inquiry-service
        image: your-registry/inquiry-service:1.0.0
        ports:
        - containerPort: 8083
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8083
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8083
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: inquiry-service
spec:
  selector:
    app: inquiry-service
  ports:
  - port: 8083
    targetPort: 8083
  type: ClusterIP
```

### 5.5 CI/CD Pipeline

**GitHub Actions Example:**

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build with Maven
        run: mvn clean package -DskipTests
      
      - name: Run Tests
        run: mvn test
      
      - name: Build Docker Image
        run: docker build -t inquiry-service:${{ github.sha }} .
      
      - name: Push to Registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push inquiry-service:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/inquiry-service inquiry-service=inquiry-service:${{ github.sha }}
```

### 5.6 Monitoring & Observability

#### **Prometheus + Grafana**

**Micrometer Configuration:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  metrics:
    export:
      prometheus:
        enabled: true
```

**Custom Metrics:**
```java
@Service
public class InquiryService {
    
    private final Counter inquiryCreatedCounter;
    private final Timer inquiryProcessingTimer;
    
    public InquiryService(MeterRegistry meterRegistry) {
        this.inquiryCreatedCounter = Counter.builder("inquiry.created")
            .description("Number of inquiries created")
            .register(meterRegistry);
        
        this.inquiryProcessingTimer = Timer.builder("inquiry.processing.time")
            .description("Time taken to process inquiry")
            .register(meterRegistry);
    }
    
    public InquiryDTO createInquiry(InquiryCreationDTO dto) {
        return Timer.Sample.start(inquiryProcessingTimer)
            .stop(() -> {
                Inquiry inquiry = inquiryRepository.save(toEntity(dto));
                inquiryCreatedCounter.increment();
                return toDTO(inquiry);
            });
    }
}
```

#### **Distributed Tracing (Zipkin/Jaeger)**

```yaml
# Add to application.yml
spring:
  sleuth:
    zipkin:
      base-url: http://zipkin:9411
    sampler:
      probability: 1.0
```

#### **ELK Stack (Logging)**

```yaml
logging:
  level:
    root: INFO
    com.crm: DEBUG
  pattern:
    file: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
  
# Logback configuration for ELK
```

---

## 6. Migration Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goals:**
- Set up infrastructure
- Create API Gateway
- Implement Authentication Service
- Set up service discovery

**Tasks:**
1. ✅ Set up development environment (Docker, Kubernetes)
2. ✅ Create Eureka Server
3. ✅ Create API Gateway with routing
4. ✅ Migrate Authentication Service
5. ✅ Migrate User Management Service
6. ✅ Set up PostgreSQL databases
7. ✅ Implement JWT authentication across services

**Deliverables:**
- API Gateway operational
- Auth service migrated
- User service migrated
- Basic service-to-service communication

### Phase 2: Core Services (Weeks 5-8)

**Goals:**
- Migrate core business services
- Implement inter-service communication
- Set up messaging infrastructure

**Tasks:**
1. ✅ Migrate Inquiry Service
2. ✅ Migrate Campaign Service
3. ✅ Migrate Program Service
4. ✅ Set up RabbitMQ/Kafka
5. ✅ Implement event-driven communication
6. ✅ Migrate Notification Service

**Deliverables:**
- Core services operational
- Event-driven architecture in place
- Notification system working

### Phase 3: Advanced Features (Weeks 9-12)

**Goals:**
- Migrate remaining services
- Implement distributed transactions
- Set up monitoring

**Tasks:**
1. ✅ Migrate Task Management Service
2. ✅ Migrate Project Management Service
3. ✅ Migrate Communication Service (WhatsApp/Email)
4. ✅ Migrate Meeting Service
5. ✅ Migrate Content Approval Service
6. ✅ Migrate Reporting Service
7. ✅ Set up Prometheus + Grafana
8. ✅ Implement distributed tracing

**Deliverables:**
- All services migrated
- Monitoring and observability in place
- Full feature parity with monolith

### Phase 4: Optimization & Testing (Weeks 13-16)

**Goals:**
- Performance optimization
- Load testing
- Security hardening
- Documentation

**Tasks:**
1. ✅ Performance testing and optimization
2. ✅ Security audit
3. ✅ Load testing
4. ✅ Documentation completion
5. ✅ Team training
6. ✅ Production deployment plan

**Deliverables:**
- Performance benchmarks met
- Security hardened
- Production-ready system
- Complete documentation

### Phase 5: Production Migration (Weeks 17-20)

**Goals:**
- Gradual production cutover
- Monitor and optimize
- Decommission monolith

**Tasks:**
1. ✅ Staging environment deployment
2. ✅ User acceptance testing
3. ✅ Production deployment (Strangler Fig)
4. ✅ Monitor and optimize
5. ✅ Gradual traffic migration
6. ✅ Final cutover
7. ✅ Decommission monolith

**Deliverables:**
- Production system live
- Monolith decommissioned
- Migration complete

---

## 7. Testing Strategy

### 7.1 Unit Testing

```java
@ExtendWith(MockitoExtension.class)
class InquiryServiceTest {
    
    @Mock
    private InquiryRepository inquiryRepository;
    
    @Mock
    private UserServiceClient userServiceClient;
    
    @InjectMocks
    private InquiryService inquiryService;
    
    @Test
    void testCreateInquiry() {
        // Given
        InquiryCreationDTO dto = new InquiryCreationDTO();
        dto.setFullName("John Doe");
        dto.setPhone("1234567890");
        
        Inquiry savedInquiry = new Inquiry();
        savedInquiry.setId("123");
        savedInquiry.setFullName("John Doe");
        
        when(inquiryRepository.save(any(Inquiry.class))).thenReturn(savedInquiry);
        
        // When
        InquiryDTO result = inquiryService.createInquiry(dto);
        
        // Then
        assertThat(result.getFullName()).isEqualTo("John Doe");
        verify(inquiryRepository).save(any(Inquiry.class));
    }
}
```

### 7.2 Integration Testing

```java
@SpringBootTest
@AutoConfigureMockMvc
class InquiryControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private InquiryRepository inquiryRepository;
    
    @Test
    void testGetAllInquiries() throws Exception {
        // Setup test data
        Inquiry inquiry = new Inquiry();
        inquiry.setFullName("Test User");
        inquiryRepository.save(inquiry);
        
        // Perform request
        mockMvc.perform(get("/inquiries")
                .header("Authorization", "Bearer " + getTestToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].fullName").value("Test User"));
    }
}
```

### 7.3 Contract Testing (Pact)

```java
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "user-service")
class UserServiceClientTest {
    
    @Pact(consumer = "inquiry-service")
    public RequestResponsePact getUserPact(PactDslWithProvider builder) {
        return builder
            .given("user exists")
            .uponReceiving("a request for user")
            .path("/users/123")
            .method("GET")
            .willRespondWith()
            .status(200)
            .body(new PactDslJsonBody()
                .stringType("id", "123")
                .stringType("name", "John Doe")
                .stringType("email", "john@example.com"))
            .toPact();
    }
    
    @Test
    @PactTestFor(pactMethod = "getUserPact")
    void testGetUser(MockServer mockServer) {
        // Test implementation
    }
}
```

### 7.4 End-to-End Testing

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class E2EInquiryFlowTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void testCompleteInquiryFlow() {
        // 1. Create inquiry
        InquiryCreationDTO dto = new InquiryCreationDTO();
        dto.setFullName("E2E Test User");
        ResponseEntity<InquiryDTO> createResponse = restTemplate.postForEntity(
            "/api/inquiries", dto, InquiryDTO.class);
        
        // 2. Get inquiry
        String inquiryId = createResponse.getBody().getId();
        ResponseEntity<InquiryDTO> getResponse = restTemplate.getForEntity(
            "/api/inquiries/" + inquiryId, InquiryDTO.class);
        
        // 3. Verify
        assertThat(getResponse.getBody().getFullName()).isEqualTo("E2E Test User");
    }
}
```

---

## 8. Common Pitfalls & Solutions

### 8.1 Session Management in Distributed Architecture

**Problem:** HTTP sessions don't work across services

**Solution:** 
- Use stateless JWT tokens
- Store session data in Redis (if needed)
- Pass user context via headers

### 8.2 Database Transactions Across Services

**Problem:** Cannot use ACID transactions across services

**Solution:**
- Use Saga pattern
- Implement eventual consistency
- Use compensating transactions

### 8.3 Service-to-Service Authentication

**Problem:** How to authenticate service calls

**Solution:**
- Use service-to-service tokens
- Implement mTLS (mutual TLS)
- Use API keys for internal services

### 8.4 Data Consistency

**Problem:** Data inconsistency across services

**Solution:**
- Implement event sourcing
- Use CQRS for read/write separation
- Implement eventual consistency patterns

### 8.5 Performance Degradation

**Problem:** Network latency between services

**Solution:**
- Implement caching (Redis)
- Use async communication where possible
- Implement circuit breakers
- Use connection pooling

---

## 9. Sample Spring Boot Service Implementation

### 9.1 Complete Inquiry Service Example

See attached files:
- `inquiry-service/` - Complete Spring Boot service implementation
- Includes: Controller, Service, Repository, DTOs, Configuration

### 9.2 Key Files Structure

```
inquiry-service/
├── pom.xml
├── src/main/java/com/crm/inquiry/
│   ├── InquiryServiceApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── WebClientConfig.java
│   │   └── RabbitMQConfig.java
│   ├── controller/
│   │   └── InquiryController.java
│   ├── service/
│   │   ├── InquiryService.java
│   │   └── InquiryEventPublisher.java
│   ├── repository/
│   │   └── InquiryRepository.java
│   ├── model/
│   │   ├── entity/
│   │   │   └── Inquiry.java
│   │   └── dto/
│   │       ├── InquiryDTO.java
│   │       └── InquiryCreationDTO.java
│   ├── client/
│   │   └── UserServiceClient.java
│   └── exception/
│       └── GlobalExceptionHandler.java
└── src/main/resources/
    ├── application.yml
    └── application-dev.yml
```

---

## 10. Migration Checklist

### Pre-Migration
- [ ] Complete architecture analysis
- [ ] Identify all API endpoints
- [ ] Document all database relationships
- [ ] List all external dependencies
- [ ] Create service boundaries
- [ ] Set up development environment

### Phase 1: Foundation
- [ ] Set up Docker/Kubernetes
- [ ] Create Eureka Server
- [ ] Create API Gateway
- [ ] Migrate Auth Service
- [ ] Migrate User Service
- [ ] Set up PostgreSQL databases
- [ ] Implement JWT authentication

### Phase 2: Core Services
- [ ] Migrate Inquiry Service
- [ ] Migrate Campaign Service
- [ ] Migrate Program Service
- [ ] Set up RabbitMQ/Kafka
- [ ] Implement event-driven communication
- [ ] Migrate Notification Service

### Phase 3: Advanced Features
- [ ] Migrate Task Service
- [ ] Migrate Project Service
- [ ] Migrate Communication Service
- [ ] Migrate Meeting Service
- [ ] Migrate Content Service
- [ ] Migrate Reporting Service
- [ ] Set up monitoring

### Phase 4: Testing & Optimization
- [ ] Unit tests for all services
- [ ] Integration tests
- [ ] Contract tests (Pact)
- [ ] E2E tests
- [ ] Performance testing
- [ ] Security audit
- [ ] Load testing

### Phase 5: Production
- [ ] Staging deployment
- [ ] UAT completion
- [ ] Production deployment plan
- [ ] Gradual traffic migration
- [ ] Monitor and optimize
- [ ] Final cutover
- [ ] Decommission monolith

---

## 11. Team Onboarding

### Prerequisites
- Java 17+ knowledge
- Spring Boot experience
- Microservices concepts
- Docker/Kubernetes basics

### Training Plan
1. **Week 1:** Spring Boot fundamentals
2. **Week 2:** Microservices patterns
3. **Week 3:** Hands-on development
4. **Week 4:** Testing and deployment

### Documentation
- API documentation (OpenAPI/Swagger)
- Architecture diagrams
- Runbooks for operations
- Troubleshooting guides

---

## 12. Conclusion

This migration plan provides a comprehensive roadmap for converting the Education CRM System from a Node.js monolith to a Spring Boot microservices architecture. The phased approach ensures minimal disruption while maintaining system functionality throughout the migration process.

**Key Success Factors:**
1. Thorough planning and analysis
2. Phased migration approach
3. Comprehensive testing
4. Team training and documentation
5. Continuous monitoring and optimization

**Estimated Timeline:** 20 weeks (5 months)
**Team Size:** 4-6 developers
**Budget Considerations:** Infrastructure costs (cloud services, databases, messaging)

---

## Appendix A: Architecture Diagrams

[Include C4 diagrams, sequence diagrams, deployment diagrams]

## Appendix B: API Documentation

[Include OpenAPI/Swagger specifications for each service]

## Appendix C: Database Migration Scripts

[Include SQL scripts for schema migration]

## Appendix D: Docker/Kubernetes Configurations

[Include complete Dockerfiles and K8s manifests]

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** Migration Team  
**Status:** Draft - Pending Review
