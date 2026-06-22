import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CATEGORIES = [
    "Payment Issue",
    "Inventory Issues",
    "Portal Access",
    "Delivery Issues",
    "Contract Query",
    "Order Discrepancies",
    "User Onboarding",
    "Quality Control",
    "Pricing & Billing",
    "Service Delays",
    "Logistics Support",
    "Database & Sync",
    "Account & Security",
    "Refunds & Returns",
    "GST Compliance",
    "KYC Verification",
    "Store Operations",
    "HR & Workforce",
    "IT Infrastructure",
    "Finance & Reporting"
]

def suggest_category(description):
    if not description or len(description.strip()) < 5:
        return "IT Support"

    prompt = f"""
Classify this ticket into exactly one category:
{", ".join(CATEGORIES)}

Ticket description:
{description}

Return only the category name.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        category = response.choices[0].message.content.strip()
        return category if category in CATEGORIES else "IT Support"

    except Exception as e:
        print("Groq error:", e)
        return "IT Support"
