import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email configuration
smtp_server = 'smtp.gmail.com'
smtp_port = 587  # Use 465 for SSL, 587 for TLS
smtp_user = 'email.abhaynarayanbairagi@gmail.com'
smtp_password = 'yooi eeji ybej wneu'
from_email = 'email.abhaynarayanbairagi@gmail.com'
to_email = 'abhaybairagi92@gmail.com'

# Create message container
msg = MIMEMultipart()
msg['From'] = from_email
msg['To'] = to_email
msg['Subject'] = 'Subject of the email'

# Body of the email
body = 'This is the body of the email.'
msg.attach(MIMEText(body, 'plain'))

# Connect to the server and send email
try:
    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()  # Secure the connection
    server.login(smtp_user, smtp_password)
    server.sendmail(from_email, to_email, msg.as_string())
    print('Email sent successfully!')
except Exception as e:
    print(f'Failed to send email: {e}')
finally:
    server.quit()
