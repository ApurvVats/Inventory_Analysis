import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export const sendMail = async ({ to, subject, text, html }) => {
  const msg = {
    to,
    from: process.env.VERIFIED_SENDER_EMAIL, 
    subject,
    text,
    html,
  }
 try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email via SendGrid to ${to}:`);
    // SendGrid provides more detailed error responses
    if (error.response) {
      console.error(error.response.body);
    } else {
      console.error(error);
    }
    // As before, we just log the error and don't crash the request.
  }
};