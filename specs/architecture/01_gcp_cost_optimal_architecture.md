# Google Cloud Platform - Cost-Optimal Architecture Specification

## Overview

This document outlines the most cost-effective architecture for deploying the Modern SaaS Template on Google Cloud Platform using Cloud Run and Cloud SQL, optimized for minimal costs while maintaining production-ready capabilities.

## Architecture Summary

The architecture consists of:

- **2 Cloud Run services** (Frontend + API) with Cloud SQL Auth Proxy
- **1 Cloud SQL PostgreSQL instance** (private IP, proxy-secured)
- **Service accounts** with least-privilege IAM roles
- **Cloud SQL Auth Proxy** for secure database connections
- **Container Registry** for image storage
- **Cloud Build** for CI/CD with security scanning

## Architecture Diagram

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor': '#E8F4FD',
  'primaryTextColor': '#2D3748',
  'primaryBorderColor': '#4A90E2',
  'lineColor': '#4A90E2',
  'secondaryColor': '#F0F9FF',
  'tertiaryColor': '#E2E8F0',
  'background': '#FFFFFF',
  'mainBkg': '#F7FAFC',
  'secondBkg': '#EDF2F7',
  'tertiaryBkg': '#E2E8F0'
}}}%%

graph TD
    User[👤 User<br/>app.elitizon.com] --> CDN[☁️ CloudFlare CDN<br/>Static Assets]
    User --> CR_Web[🌐 Cloud Run Web<br/>Next.js Frontend<br/>1 vCPU, 1GB RAM<br/>Scale 0-10 instances]
    
    CR_Web --> CR_API[⚡ Cloud Run API<br/>Hono.js Backend<br/>+ Cloud SQL Proxy<br/>1 vCPU, 512MB RAM<br/>Scale 0-5 instances<br/>🔑 Service Account Auth]
    
    subgraph ProxyConnection ["🔒 Secure Proxy Connection"]
        CR_API --> Proxy[🛡️ Cloud SQL Auth Proxy<br/>Sidecar Container<br/>Unix Socket]
        Proxy --> DB[(🗄️ Cloud SQL<br/>PostgreSQL 15<br/>Private IP Only<br/>db-f1-micro<br/>10GB SSD<br/>🔐 SSL + IAM Auth)]
    end
    
    CR_API --> External[🔌 External Services<br/>Direct HTTPS]
    
    External --> Clerk[🔐 Clerk Auth<br/>Zero Trust]
    External --> Stripe[💳 Stripe Payments<br/>PCI Compliant]
    External --> Resend[📧 Resend Email<br/>DKIM/SPF]
    External --> Sentry[🐛 Sentry Monitoring<br/>Error Tracking]
    External --> PostHog[📊 PostHog Analytics<br/>Privacy Compliant]
    
    Dev[👨‍💻 Developer] --> GitHub[📂 GitHub Repository<br/>RBAC Enabled]
    GitHub --> Actions[🔄 GitHub Actions CI/CD<br/>🔍 Security Scanning]
    Actions --> Registry[📦 Artifact Registry<br/>🛡️ Vulnerability Scanning]
    Registry --> CR_Web
    Registry --> CR_API
    
    subgraph Monitoring ["📊 Security Monitoring"]
        CloudSCC[🛡️ Cloud Security<br/>Command Center]
        AuditLogs[📝 Cloud Audit Logs<br/>Compliance Tracking]
        MonitoringService[📈 Cloud Monitoring<br/>Security Alerts]
    end
    
    ProxyConnection --> CloudSCC
    ProxyConnection --> AuditLogs
    ProxyConnection --> MonitoringService
    
    style User fill:#E8F4FD,stroke:#4A90E2,stroke-width:2px,color:#2D3748
    style CR_Web fill:#E6FFFA,stroke:#38B2AC,stroke-width:2px,color:#2D3748
    style CR_API fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#2D3748
    style DB fill:#F0FFF4,stroke:#38A169,stroke-width:3px,color:#2D3748
    style ProxyConnection fill:#F0FFF0,stroke:#228B22,stroke-width:3px,color:#2D3748
    style Proxy fill:#FFE4E1,stroke:#DC143C,stroke-width:2px,color:#2D3748
    style External fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#2D3748
    style GitHub fill:#EDF2F7,stroke:#4A5568,stroke-width:2px,color:#2D3748
    style Registry fill:#FFFAF0,stroke:#DD6B20,stroke-width:2px,color:#2D3748
    style Monitoring fill:#F0F8FF,stroke:#4169E1,stroke-width:2px,color:#2D3748
```

## Security Architecture Overview

### Cloud SQL Auth Proxy Security Model

The architecture implements a **cost-effective security** model using Cloud SQL Auth Proxy:

1. **Private Database Access**
   - Cloud SQL with private IP only
   - No public internet exposure
   - All connections via encrypted proxy

2. **Sidecar Proxy Container**
   - Cloud SQL Auth Proxy as sidecar in Cloud Run
   - Unix socket communication (local-only)
   - IAM service account authentication
   - Automatic SSL/TLS encryption

3. **Zero Network Exposure**
   - No VPC or NAT gateway required
   - Direct encrypted connections to Google services
   - Application-level security controls

### Identity and Access Management (IAM)

**Service Account Architecture:**

- **Cloud Run API Service Account**: Cloud SQL Client role only
- **Cloud Run Web Service Account**: No database access
- **Cloud Build Service Account**: Container registry permissions only

**Principle of Least Privilege:**

- Each service has minimal required permissions
- Database access only via IAM authentication
- No password-based authentication

### Database Security Layers

**Connection Security:**

1. **Private IP Only**: No public internet access
2. **Cloud SQL Auth Proxy**: Encrypted proxy tunnel
3. **IAM Authentication**: Service account based access
4. **SSL/TLS Enforcement**: All connections encrypted
5. **Unix Socket**: Local communication only

**Access Security:**

1. **Service Account Authentication**: No password-based access
2. **Connection Limits**: Prevent resource exhaustion
3. **Audit Logging**: All database operations logged
4. **Automated Backups**: Point-in-time recovery enabled

## Cost Flow Diagram

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor': '#E8F4FD',
  'primaryTextColor': '#2D3748',
  'primaryBorderColor': '#4A90E2',
  'lineColor': '#4A90E2',
  'pie1': '#E6FFFA',
  'pie2': '#FFF5F5',
  'pie3': '#F0FFF4',
  'pie4': '#FAF5FF',
  'pie5': '#FFFAF0',
  'pie6': '#EDF2F7',
  'pie7': '#FED7D7',
  'pie8': '#E8F4FD',
  'pieOuterStrokeWidth': '2px',
  'pieStrokeColor': '#2D3748',
  'pieTitleTextSize': '16px',
  'pieTitleTextColor': '#2D3748',
  'pieSectionTextSize': '14px',
  'pieSectionTextColor': '#2D3748'
}}}%%

pie title Monthly Cost Breakdown ($16-19 Cost-Effective Security)
    "Cloud SQL (private IP)" : 10
    "Cloud Run Web" : 5
    "Cloud Run API + Proxy" : 3
    "Artifact Registry" : 1
    "Security Monitoring" : 1
```

## Cost-Optimal Configuration

### 1. Cloud Run Services

#### Frontend Service (Next.js)

- **CPU**: 1 vCPU (minimum)
- **Memory**: 1 GiB (minimum for Next.js)
- **Concurrency**: 100 requests per instance
- **Min instances**: 0 (scale to zero)
- **Max instances**: 10
- **Request timeout**: 60 seconds
- **Execution environment**: Gen 2 (more cost-effective)

**Estimated Cost**: ~$5-15/month for low-medium traffic

#### API Service (Hono.js)

- **CPU**: 1 vCPU (minimum)
- **Memory**: 512 MiB (sufficient for Hono.js)
- **Concurrency**: 100 requests per instance
- **Min instances**: 0 (scale to zero)
- **Max instances**: 5
- **Request timeout**: 60 seconds
- **Execution environment**: Gen 2

**Estimated Cost**: ~$3-10/month for low-medium traffic

### 2. Cloud SQL PostgreSQL (Secure Configuration)

#### Development/Staging Configuration

- **Tier**: db-f1-micro (shared-core, 0.6 GB RAM)
- **Storage**: 10 GB SSD with encryption at rest
- **Network**: **Private IP only** (no public IP)
- **Backups**: 7-day retention with encryption
- **High Availability**: Disabled (cost optimization)
- **SSL/TLS**: Required for all connections
- **Authorized Networks**: VPC subnets only
- **Region**: Same as Cloud Run services

**Security Features:**

- Private IP connectivity only
- Cloud SQL Auth Proxy for encrypted connections
- Automated security patches
- Point-in-time recovery (PITR) enabled

**Estimated Cost**: ~$7-10/month

#### Production Configuration (Secure Budget Option)

- **Tier**: db-g1-small (shared-core, 1.7 GB RAM)
- **Storage**: 20 GB SSD with encryption
- **Network**: **Private IP only** + VPC peering
- **Backups**: 30-day retention with cross-region backup
- **High Availability**: Regional (for production workloads)
- **SSL/TLS**: Required with client certificates
- **Authorized Networks**: Specific VPC subnets only
- **Connection Limits**: Configured based on application needs

**Security Features:**

- Private IP with VPC Service Controls
- IAM database authentication
- Query insights and performance monitoring
- Automated threat detection

**Estimated Cost**: ~$25-35/month

### 3. Cloud SQL Auth Proxy Security

#### Sidecar Container Configuration

- **Container**: `gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.7.0`
- **Memory**: 64MB (minimal overhead)
- **Connection**: Unix socket (`/cloudsql/`)
- **Authentication**: IAM service account
- **Encryption**: Automatic SSL/TLS

**Security Features:**

- No network ports exposed externally
- Local Unix socket communication only
- Automatic IAM authentication
- Built-in connection pooling and security

**Estimated Cost**: $0 (included in Cloud Run instance cost)

### 4. Security Monitoring and Compliance

#### Cloud Security Command Center

- **Standard Tier**: Free
- **Premium Tier**: $5/month/project (recommended for production)

**Features:**

- Security findings aggregation
- Compliance monitoring (CIS benchmarks)
- Asset inventory and configuration analysis
- Integration with external security tools

#### Cloud Audit Logs

- **Admin Activity**: Free (always enabled)
- **Data Access**: $0.50/GiB (first 50GiB free per month)
- **System Events**: Free

**Estimated Cost**: ~$0-2/month (development), ~$5-10/month (production)

#### Cloud Monitoring and Alerting

- **Metrics**: Free tier (up to 150 metrics/minute)
- **Custom Metrics**: $0.2555/metric/month
- **Alerting**: Free (up to 5 policies)

**Estimated Cost**: ~$0-1/month

### 5. Supporting Services

#### Container Registry

- **Storage**: Standard storage class
- **Estimated usage**: 1-2 GB for container images
- **Cost**: ~$0.05-0.10/month

#### Cloud Build

- **Build time**: ~5-10 minutes per deployment
- **Frequency**: 10-20 builds per month
- **Cost**: ~$1-3/month (120 free build-minutes/day)

#### Networking

- **Egress traffic**: Minimal for API calls to external services
- **Load Balancer**: Optional, ~$18/month if using custom domain
- **Cost**: ~$0-20/month depending on traffic and LB usage

## Total Monthly Cost Estimation (Cost-Effective Security)

### Minimal Setup (Development/Testing with Security)

- Cloud Run Frontend: $5
- Cloud Run API + Proxy: $3
- Cloud SQL (f1-micro + private IP): $7
- Container Registry: $0.05
- Cloud Build: $1
- Security Monitoring (basic): $1
- **Total**: ~$17-20/month

### Production Setup (Low Traffic + Security)

- Cloud Run Frontend: $10
- Cloud Run API + Proxy: $6
- Cloud SQL (g1-small + HA): $25
- Container Registry: $0.10
- Cloud Build: $2
- Security Monitoring (premium): $5
- Audit Logs: $3
- Load Balancer (optional): $18
- **Total**: ~$69-75/month

### Production Setup (Medium Traffic + Security)

- Cloud Run Frontend: $25
- Cloud Run API + Proxy: $15
- Cloud SQL (g1-small + HA + backup): $30
- Container Registry: $0.20
- Cloud Build: $3
- Security Monitoring (premium): $5
- Audit Logs: $8
- Load Balancer: $18
- **Total**: ~$104-115/month

### Cost Savings vs VPC Approach

**Development Savings:**

- VPC Approach: $22-25/month
- Auth Proxy Approach: $17-20/month
- **Monthly Savings**: $5-7/month (**$60-84/year**)

**Production Savings:**

- VPC Approach: $82-150/month
- Auth Proxy Approach: $69-115/month  
- **Monthly Savings**: $13-35/month (**$156-420/year**)

### Security Cost Comparison

**Essential Security (Development):**

- Cloud SQL private IP: $0 (included)
- Auth Proxy sidecar: $0 (minimal overhead)
- IAM authentication: $0 (included)
- Basic monitoring: +$1/month
- **Security Premium**: +$1/month

**Enhanced Security (Production):**

- Security Command Center Premium: +$5/month
- Advanced audit logging: +$3-8/month
- High Availability database: +$10/month
- Cross-region backups: +$5/month
- **Security Premium**: +$23-28/month

## Regional Recommendations

For cost optimization, deploy in regions with lower pricing:

1. **us-central1** (Iowa) - Generally lowest cost
2. **us-east1** (South Carolina) - Low cost
3. **europe-west1** (Belgium) - EU option
4. **asia-southeast1** (Singapore) - APAC option

## Architecture Benefits

### Security Advantages

- **Defense in Depth**: Multiple security layers protect against various attack vectors
- **Zero Trust Network**: No implicit trust, verify every connection
- **Private Database Access**: Cloud SQL isolated from public internet
- **Encrypted Communication**: SSL/TLS for all data in transit
- **IAM Integration**: Service account-based authentication
- **Audit Trail**: Comprehensive logging for compliance and forensics
- **Automated Security**: Built-in threat detection and security patches
- **Compliance Ready**: SOC 2, GDPR, and industry standard alignment

### Cost Advantages

- **Scale-to-zero**: Pay only for actual usage
- **Shared-core instances**: Significant cost savings vs dedicated cores
- **No infrastructure management**: Reduces operational costs
- **Efficient resource utilization**: Auto-scaling based on demand
- **Security included**: Many security features at no extra cost

### Technical Advantages

- **Serverless**: No server management required
- **Auto-scaling**: Handles traffic spikes automatically
- **High availability**: Built-in redundancy and failover
- **Managed security**: Automated security updates and patches
- **Integration**: Native GCP service integration
- **Developer productivity**: Focus on application code, not infrastructure

## Resource Requirements Analysis

### Application Requirements

- **Frontend (Next.js)**: Memory-intensive due to React SSR
- **API (Hono.js)**: Lightweight, CPU-efficient
- **Database**: PostgreSQL with standard OLTP workload
- **External integrations**: Clerk, Stripe, Resend, Sentry, PostHog

### Traffic Patterns

- **B2B SaaS**: Typically business hours traffic
- **Scale-to-zero compatibility**: Perfect for Cloud Run
- **Database connections**: Managed connection pooling needed

## Direct Database Access Configuration

### Getting Your IP Address

First, find your current public IP address:

```bash
# Get your current public IP
curl -4 ifconfig.me
# or
curl -4 icanhazip.com
# or
dig +short myip.opendns.com @resolver1.opendns.com
```

### Option 1: Add IP via gcloud CLI (Recommended)

Update the Cloud SQL authorized networks directly:

```bash
# Replace variables with your actual project, instance, and IP
gcloud sql instances patch $INSTANCE_NAME \
  --project $PROJECT_ID \
  --authorized-networks "${YOUR_IP_ADDRESS}/32" \
  --quiet
```

### Option 2: Add IP via gcloud CLI (Quick)

```bash
# Get your current IP
MY_IP=$(curl -s ifconfig.me)

# Add your IP to Cloud SQL authorized networks
gcloud sql instances patch saas-db-prod \
  --authorized-networks=$MY_IP/32 \
  --quiet

# Verify the change
gcloud sql instances describe saas-db-prod \
  --format="value(settings.ipConfiguration.authorizedNetworks[].value)"
```

### Option 3: Add IP via Google Cloud Console

1. Go to **Cloud SQL** in Google Cloud Console
2. Click on your instance (`saas-db-prod`)
3. Go to **Connections** tab
4. Under **Authorized networks**, click **Add network**
5. Enter your IP address with `/32` (e.g., `203.0.113.45/32`)
6. Give it a name like "My Development IP"
7. Click **Save**

### Connecting to the Database

Once your IP is authorized, you can connect directly:

**Using psql (PostgreSQL client):**

```bash
# Install PostgreSQL client if needed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Get database IP
DB_IP=$(gcloud sql instances describe saas-db-prod --format="value(ipAddresses[0].ipAddress)")

# Connect to database
psql "host=$DB_IP port=5432 dbname=saas_db user=saas_user sslmode=require"
```

**Using Cloud SQL Proxy (Alternative):**

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe saas-db-prod --format="value(connectionName)")

# Start proxy
./cloud-sql-proxy $CONNECTION_NAME

# In another terminal, connect via localhost
psql "host=127.0.0.1 port=5432 dbname=saas_db user=saas_user sslmode=disable"
```

**Using Database GUI Tools:**

Popular tools that work with Cloud SQL:

- **pgAdmin** (Free, Web-based)
- **DBeaver** (Free, Desktop)
- **TablePlus** (Paid, macOS/Windows)
- **DataGrip** (Paid, JetBrains)

Connection parameters:

- **Host**: `[DATABASE_IP]` (from gcloud command above)
- **Port**: `5432`
- **Database**: `saas_db`
- **Username**: `saas_user`
- **Password**: `[your-password]`
- **SSL Mode**: `require`

### Security Best Practices for IP Access

**Development Environment:**
✅ Add your home/office IP for development
✅ Use descriptive names for authorized networks
✅ Remove old/unused IP addresses regularly

**Production Environment:**
⚠️ Minimize authorized IPs (admin access only)
⚠️ Use VPN or bastion host for team access
⚠️ Enable audit logging for all connections
⚠️ Consider time-based access controls

**IP Management Commands:**

```bash
# List current authorized networks
gcloud sql instances describe saas-db-prod \
  --format="table(settings.ipConfiguration.authorizedNetworks[].name,
                  settings.ipConfiguration.authorizedNetworks[].value)"

# Remove an IP address
gcloud sql instances patch saas-db-prod \
  --clear-authorized-networks

# Add multiple IPs at once
gcloud sql instances patch saas-db-prod \
  --authorized-networks=203.0.113.0/32,198.51.100.0/24
```

### Temporary Access Pattern

For temporary access (like debugging production):

```bash
# Get your current IP
MY_IP=$(curl -s ifconfig.me)

# Add temporary access
gcloud sql instances patch saas-db-prod \
  --authorized-networks=$MY_IP/32

# Do your work...

# Remove access when done
gcloud sql instances patch saas-db-prod \
  --clear-authorized-networks
```

This gives you flexible, secure access to your database while maintaining the cost-effective Cloud SQL Auth Proxy setup for your applications.

## Cloud SQL Auth Proxy Implementation

### Docker Configuration

**API Service Dockerfile (Multi-container approach):**

```dockerfile
FROM oven/bun:latest

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Create directory for Cloud SQL socket
RUN mkdir -p /cloudsql && chown apiuser:nodejs /cloudsql

WORKDIR /app

# Copy application files
COPY --chown=apiuser:nodejs package.json bun.lockb ./
RUN bun install --production

COPY --chown=apiuser:nodejs . .

# Switch to non-root user
USER apiuser

EXPOSE 3001

CMD ["bun", "start"]
```

**Cloud Run Service Configuration (deployment script):**

```hcl
resource "google_cloud_run_service" "api" {
  name     = "${var.project_name}-api-${var.environment}"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "5"
        "autoscaling.knative.dev/minScale" = "0"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }

    spec {
      service_account_name = google_service_account.cloudrun_api_sa.email
      container_concurrency = 100
      timeout_seconds = 60

      # Main application container
      containers {
        name  = "app"
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/api:latest"
        
        ports {
          container_port = 3001
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${var.db_user}:${var.db_password}@localhost/saas_db?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      # Cloud SQL Proxy sidecar
      containers {
        name  = "cloud-sql-proxy"
        image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.7.0"
        
        args = [
          "--structured-logs",
          "--port=5432",
          "--unix-socket=/cloudsql",
          google_sql_database_instance.main.connection_name
        ]

        resources {
          limits = {
            cpu    = "0.1"
            memory = "64Mi"
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }

        security_context {
          run_as_non_root = true
          run_as_user     = 65532
        }
      }

      volumes {
        name = "cloudsql"
        empty_dir {
          medium     = "Memory"
          size_limit = "10Mi"
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

### Application Code Changes

**Database Connection (Node.js/Bun):**

```typescript
// packages/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use Unix socket connection via Cloud SQL Proxy
    const { PROJECT_ID, REGION, INSTANCE_NAME } = process.env
    return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost/saas_db?host=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_NAME}`
  }
  
  // Development: direct connection
  return process.env.DATABASE_URL
}

const client = postgres(getDatabaseUrl()!, {
  max: 10,          // Connection pool size
  idle_timeout: 20, // Seconds
  connect_timeout: 10
})

export const db = drizzle(client, { schema })
```

### Security Best Practices Implementation

✅ **Private IP Configuration**

```bash
# Cloud SQL with private IP only
gcloud sql instances create saas-db-prod \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --network=projects/PROJECT_ID/global/networks/default \
  --no-assign-ip \
  --require-ssl
```

✅ **Service Account IAM**

```bash
# Create service account for API
gcloud iam service-accounts create cloudrun-api-sa \
  --display-name="Cloud Run API Service Account"

# Grant minimal Cloud SQL Client role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cloudrun-api-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

✅ **Container Security**

```bash
# Build with security scanning
docker build -t api:latest .
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image api:latest
```

## Next Steps

1. **Infrastructure Provisioning**: Set up GCP resources
2. **Container Optimization**: Optimize Docker images for size and startup time
3. **CI/CD Pipeline**: Implement automated deployments
4. **Monitoring Setup**: Configure alerting and monitoring
5. **Cost Monitoring**: Set up billing alerts and budget controls

## Cost Optimization Strategies

Detailed in separate specification documents:

- `02_infrastructure_provisioning.md`
- `03_deployment_automation.md`
- `04_cost_optimization_strategies.md`
