# HTTPS/TLS Configuration Guide

## Overview

This document provides guidance on configuring HTTPS/TLS for the MSME AI Assistant API in production environments. All sensitive data transmissions must be encrypted using TLS 1.2 or higher.

## Development Environment

For local development, the application runs on HTTP (port 3000 by default). This is acceptable for development but **must not be used in production**.

## Production Deployment Options

### Option 1: Reverse Proxy (Recommended)

Use a reverse proxy like Nginx or Apache to handle TLS termination. This is the most common and recommended approach.

#### Nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificate Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # SSL Protocol Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # SSL Session Configuration
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Option 2: Node.js HTTPS Server

For environments where a reverse proxy is not available, you can configure Node.js to serve HTTPS directly.

#### Implementation

1. **Install SSL certificates** in a secure location (e.g., `/etc/ssl/certs/`)

2. **Update environment variables**:
```bash
# .env
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
PORT=443
```

3. **Update `src/index.ts`**:
```typescript
import https from 'https';
import fs from 'fs';
import express from 'express';
import config from './config/env';

const app = express();

// ... middleware and routes setup ...

if (config.https.enabled) {
  const httpsOptions = {
    cert: fs.readFileSync(config.https.certPath),
    key: fs.readFileSync(config.https.keyPath),
  };

  https.createServer(httpsOptions, app).listen(config.port, () => {
    console.log(`HTTPS Server running on port ${config.port}`);
  });
} else {
  app.listen(config.port, () => {
    console.log(`HTTP Server running on port ${config.port}`);
  });
}
```

4. **Update `src/config/env.ts`**:
```typescript
export const config = {
  // ... existing config ...
  
  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    certPath: process.env.SSL_CERT_PATH || '',
    keyPath: process.env.SSL_KEY_PATH || '',
  },
};
```

### Option 3: Cloud Platform Load Balancer

Most cloud platforms (AWS, Google Cloud, Azure) provide load balancers that handle TLS termination automatically.

#### AWS Application Load Balancer (ALB)
- Configure ALB with SSL certificate from AWS Certificate Manager (ACM)
- ALB handles TLS termination
- Backend communicates with ALB over HTTP in private VPC

#### Google Cloud Load Balancer
- Use Google-managed SSL certificates
- Configure HTTPS load balancer
- Backend instances communicate over HTTP internally

#### Azure Application Gateway
- Configure SSL certificate in Azure Key Vault
- Application Gateway handles TLS termination
- Backend pool communicates over HTTP

## SSL Certificate Options

### 1. Let's Encrypt (Free)

Let's Encrypt provides free SSL certificates with automatic renewal.

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

### 2. Commercial Certificate Authorities

Purchase SSL certificates from providers like:
- DigiCert
- Comodo
- GoDaddy
- Namecheap

### 3. Cloud Provider Certificates

- **AWS Certificate Manager (ACM)**: Free SSL certificates for AWS resources
- **Google Cloud Certificate Manager**: Managed SSL certificates
- **Azure Key Vault**: Certificate management for Azure resources

## Security Best Practices

### 1. TLS Version

- **Minimum**: TLS 1.2
- **Recommended**: TLS 1.3
- **Disable**: SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1

### 2. Cipher Suites

Use strong cipher suites only:
```
TLS_AES_128_GCM_SHA256
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-RSA-AES256-GCM-SHA384
```

### 3. HTTP Strict Transport Security (HSTS)

Always enable HSTS to prevent protocol downgrade attacks:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 4. Certificate Validation

- Use certificates from trusted Certificate Authorities
- Ensure certificate matches the domain name
- Monitor certificate expiration dates
- Implement automatic renewal

### 5. Additional Security Headers

```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'" always;
```

## Testing HTTPS Configuration

### 1. SSL Labs Test

Test your SSL configuration at: https://www.ssllabs.com/ssltest/

Aim for an A+ rating.

### 2. Command Line Testing

```bash
# Test TLS connection
openssl s_client -connect api.yourdomain.com:443 -tls1_2

# Check certificate details
openssl s_client -connect api.yourdomain.com:443 -showcerts

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt certificate.crt
```

### 3. Browser Testing

- Check for green padlock icon
- Verify certificate details
- Test HTTPS redirect from HTTP

## Monitoring and Maintenance

### Certificate Expiration Monitoring

Set up alerts for certificate expiration:

```bash
# Check certificate expiration
echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Automated Renewal

For Let's Encrypt:
```bash
# Test renewal
sudo certbot renew --dry-run

# Renewal is automatic via cron/systemd timer
```

### Log Monitoring

Monitor SSL/TLS errors in logs:
- Certificate validation failures
- Protocol version mismatches
- Cipher suite negotiation failures

## Compliance Requirements

### PCI DSS

If handling payment data:
- TLS 1.2 minimum (TLS 1.3 recommended)
- Strong cipher suites only
- Regular security scans

### GDPR

- Encrypt data in transit (TLS)
- Encrypt data at rest (implemented via encryption utilities)
- Document security measures

### SOC 2

- Implement TLS 1.2 or higher
- Monitor and log security events
- Regular security assessments

## Troubleshooting

### Common Issues

1. **Certificate Not Trusted**
   - Ensure certificate chain is complete
   - Verify CA certificate is included

2. **Mixed Content Warnings**
   - Ensure all resources load over HTTPS
   - Update API URLs to use HTTPS

3. **Performance Issues**
   - Enable HTTP/2
   - Use session resumption
   - Implement OCSP stapling

4. **Certificate Renewal Failures**
   - Check file permissions
   - Verify DNS configuration
   - Review renewal logs

## References

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP Transport Layer Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
