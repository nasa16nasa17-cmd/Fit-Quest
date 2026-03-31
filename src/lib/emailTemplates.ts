export const getAdminNewApplicationEmail = (trainerName: string, trainerEmail: string, appUrl: string) => ({
  subject: `New Coach Application: ${trainerName}`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #000;">New Coach Application</h2>
      <p>A new trainer has applied to join FITQUEST.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${trainerName}</p>
        <p><strong>Email:</strong> ${trainerEmail}</p>
      </div>
      <p>Please review the application in the admin dashboard to approve or reject it.</p>
      <a href="${appUrl}/dashboard/approvals" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 10px;">Review Application</a>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">FITQUEST Admin System</p>
    </div>
  `
});

export const getApplicantApprovalEmail = (trainerName: string, appUrl: string) => ({
  subject: "Congratulations! Your FITQUEST Coach Application was Approved",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #000;">Welcome to the Team, ${trainerName}!</h2>
      <p>We are thrilled to inform you that your coach application has been approved.</p>
      <p>Your profile is now live on the FITQUEST marketplace, and you can start accepting bookings from clients immediately.</p>
      <div style="margin: 30px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Go to Dashboard</a>
      </div>
      <p>Next steps:</p>
      <ul>
        <li>Complete your profile details</li>
        <li>Set your availability</li>
        <li>Connect your Stripe account for payouts</li>
      </ul>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">FITQUEST Team</p>
    </div>
  `
});

export const getApplicantRejectionEmail = (trainerName: string) => ({
  subject: "Update regarding your FITQUEST Coach Application",
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #000;">Application Update</h2>
      <p>Hi ${trainerName},</p>
      <p>Thank you for your interest in joining FITQUEST as a coach.</p>
      <p>After carefully reviewing your application, we regret to inform you that we cannot approve your profile at this time.</p>
      <p>Our team looks for specific criteria regarding certifications and experience to ensure the highest quality for our clients. You are welcome to re-apply in the future once you have gained more experience or additional certifications.</p>
      <p>Best of luck with your fitness journey.</p>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">FITQUEST Team</p>
    </div>
  `
});
