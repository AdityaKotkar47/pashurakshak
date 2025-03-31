const nodemailer = require('nodemailer');

// Create Gmail transporter
const gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Create backup transporter using ethereal.email
let backupTransporter = null;

// Initialize backup email service
async function initializeBackupTransporter() {
    try {
        // Generate test SMTP service account from ethereal.email
        const testAccount = await nodemailer.createTestAccount();

        backupTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        console.log('Backup email service initialized');
    } catch (error) {
        console.error('Failed to initialize backup email service:', error);
    }
}

// Initialize backup service
initializeBackupTransporter();

// Send email with fallback
async function sendEmail(options) {
    try {
        // Try Gmail first
        const info = await gmailTransporter.sendMail(options);
        console.log('Email sent via Gmail:', info.response);
        return true;
    } catch (error) {
        console.error('Gmail send failed, trying backup service:', error);

        if (backupTransporter) {
            try {
                const info = await backupTransporter.sendMail(options);
                console.log('Email sent via backup service:', info.response);
                console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
                return true;
            } catch (backupError) {
                console.error('Backup email service failed:', backupError);
                return false;
            }
        }
        return false;
    }
}

// Send approval email with login credentials
const sendApprovalEmail = async (email, password, ngoName) => {
    const loginUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/login`
        : 'http://localhost:3000/login';

    const mailOptions = {
        from: '"Pashurakshak Admin" <sih.pravaah@gmail.com>',
        to: email,
        subject: '🎉 NGO Registration Approved - Pashurakshak',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #28a745; text-align: center;">Congratulations! 🎊</h1>
        <h2 style="color: #333; text-align: center;">Your NGO Registration is Approved</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #333;">Dear <strong>${ngoName}</strong>,</p>
          <p style="color: #333;">Great news! Your NGO registration has been approved. You can now access your dashboard using the following credentials:</p>
        </div>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32; text-align: center;">Your Login Credentials</h3>
          <p style="color: #333; text-align: center;"><strong>Email:</strong> ${email}</p>
          <p style="color: #333; text-align: center;"><strong>Password:</strong> ${password}</p>
        </div>
        
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #e65100; margin: 0;"><strong>Important:</strong> Please change your password after your first login.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${loginUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Best regards,<br><strong>Team Pashurakshak</strong></p>
        </div>
      </div>
    `
    };

    return await sendEmail(mailOptions);
};

// Send rejection email
const sendRejectionEmail = async (email, ngoName) => {
    const mailOptions = {
        from: '"Pashurakshak Admin" <sih.pravaah@gmail.com>',
        to: email,
        subject: '❌ NGO Registration Status Update - Pashurakshak',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc3545; text-align: center;">NGO Registration Update</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #333;">Dear <strong>${ngoName}</strong>,</p>
          <p style="color: #333;">We regret to inform you that your NGO registration application has been rejected.</p>
        </div>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #e65100;">Possible Reasons:</h3>
          <ul style="color: #333;">
            <li>Incomplete or incorrect documentation</li>
            <li>Invalid registration details</li>
            <li>Non-compliance with our eligibility criteria</li>
          </ul>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #0d47a1; margin: 0;">You can submit a new application with the correct information and documentation.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>For any queries, please contact our support team.</p>
          <p>Best regards,<br><strong>Team Pashurakshak</strong></p>
        </div>
      </div>
    `
    };

    return await sendEmail(mailOptions);
};

// Send status update email
const sendStatusUpdateEmail = async (email, ngoName, status) => {
    const mailOptions = {
        from: '"Pashurakshak Admin" <sih.pravaah@gmail.com>',
        to: email,
        subject: `📝 NGO Status Update - ${status.toUpperCase()} - Pashurakshak`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066cc; text-align: center;">NGO Status Update</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #333;">Dear <strong>${ngoName}</strong>,</p>
          <p style="color: #333;">Your NGO status has been updated to: <strong>${status}</strong></p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #0d47a1; margin: 0;">You can check your dashboard for more details.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Best regards,<br><strong>Team Pashurakshak</strong></p>
        </div>
      </div>
    `
    };

    return await sendEmail(mailOptions);
};

// Send registration confirmation email
const sendRegistrationEmail = async (email, ngoName) => {
    const mailOptions = {
        from: '"Pashurakshak Admin" <sih.pravaah@gmail.com>',
        to: email,
        subject: '📋 NGO Registration Received - Pashurakshak',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066cc; text-align: center;">Registration Confirmation</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #333;">Dear <strong>${ngoName}</strong>,</p>
          <p style="color: #333;">Thank you for registering your NGO with Pashurakshak!</p>
          <p style="color: #333;">We have received your registration application and it is currently under review.</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #0d47a1; margin: 0;">Our team will review your application within 1-2 business days.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Best regards,<br><strong>Team Pashurakshak</strong></p>
        </div>
      </div>
    `
    };

    return await sendEmail(mailOptions);
};

// Send volunteer credentials email
const sendVolunteerEmail = async (email, password, volunteerName, ngoName) => {
    const mailOptions = {
        from: '"Pashurakshak NGO" <sih.pravaah@gmail.com>',
        to: email,
        subject: '🐾 Welcome to Pashurakshak Volunteer Team!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #28a745; text-align: center;">Welcome to the Team! 🎊</h1>
        <h2 style="color: #333; text-align: center;">Pashurakshak Volunteer Registration</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #333;">Dear <strong>${volunteerName}</strong>,</p>
          <p style="color: #333;">You have been registered as a volunteer with <strong>${ngoName}</strong>. Thank you for joining our mission to help animals in need!</p>
        </div>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32; text-align: center;">Your Mobile App Credentials</h3>
          <p style="color: #333; text-align: center;"><strong>Email:</strong> ${email}</p>
          <p style="color: #333; text-align: center;"><strong>Password:</strong> ${password}</p>
        </div>
        
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #e65100; margin: 0;"><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="background-color: #28a745; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px;">Login to the Pashurakshak Mobile App</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Thank you for your dedication to animal welfare!</p>
          <p>Best regards,<br><strong>${ngoName} Team</strong></p>
        </div>
      </div>
    `
    };

    return await sendEmail(mailOptions);
};

module.exports = {
    sendApprovalEmail,
    sendRejectionEmail,
    sendStatusUpdateEmail,
    sendRegistrationEmail,
    sendVolunteerEmail
}; 