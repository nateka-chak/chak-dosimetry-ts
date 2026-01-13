// app/api/notifications/sms/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { to, message, shipmentId } = await request.json();

    // Validate phone number
    if (!to || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await client.messages.create({
      body: `Shipment Update: ${message}\nShipment ID: #${shipmentId}`,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: to
    });

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      sid: result.sid
    });
  } catch (error) {
    console.error("SMS sending error:", error);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}