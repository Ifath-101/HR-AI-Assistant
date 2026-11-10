"""
Script to generate standard fictional HR policy PDF documents for testing and demonstration.
Uses PyMuPDF (fitz) to create clean, readable multi-page PDFs.
"""
from pathlib import Path
import fitz

OUTPUT_DIR = Path(__file__).resolve().parent

def create_leave_policy_pdf():
    doc = fitz.open()

    # Page 1: Annual Leave & Carry Forward
    page1 = doc.new_page(width=595, height=842) # A4
    text_page1 = """PEOPLESPHERE CORP - GLOBAL HR POLICIES
Document: Comprehensive Leave Policy
Version: 3.2 | Effective Date: January 1, 2026
Applicable To: All Full-Time and Permanent Employees

SECTION 1: ANNUAL LEAVE ENTITLEMENT AND ACCRUAL
1.1 Annual Entitlement:
All permanent full-time employees are entitled to twenty (20) days of paid annual leave per calendar year.
Leave accrues on a pro-rata basis at the rate of 1.67 working days per completed month of active service.

1.2 Application and Approval Procedure:
Employees must request planned annual leave through the PeopleSphere HR Portal:
- For leave requests of three (3) or more consecutive working days: submit requests at least two (2) weeks (10 business days) in advance.
- For short leave requests of one (1) or two (2) days: submit requests at least forty-eight (48) hours in advance.
All annual leave requests require explicit digital approval from the employee's assigned Reporting Manager before leave can be taken.

1.3 Annual Leave Carry-Forward Rules:
- Employees are strongly encouraged to utilize their full annual leave balance during each calendar year to maintain work-life balance.
- A maximum of five (5) unused annual leave days may be carried forward into the subsequent calendar year.
- Any unused annual leave days exceeding the five-day limit will be forfeited automatically on December 31st at midnight.
- Carried-forward annual leave days must be utilized within the first six (6) months of the new calendar year (by June 30th).
- Exception: In rare operational emergencies where leave was cancelled by management, an exception may be granted in writing by the HR Director.

1.4 Leave Encashment:
Unused annual leave cannot be converted to monetary payment or encashed during active employment.
Upon formal separation or resignation, any accrued, unused leave balance within company limits will be compensated in the final settlement paycheck.
"""
    page1.insert_text((50, 60), text_page1, fontsize=10, lineheight=1.4)

    # Page 2: Medical Leave, Hospitalization & Special Leave
    page2 = doc.new_page(width=595, height=842)
    text_page2 = """PEOPLESPHERE CORP - GLOBAL HR POLICIES
Document: Comprehensive Leave Policy (Page 2)

SECTION 2: MEDICAL AND SICK LEAVE
2.1 Medical Leave Entitlement:
Full-time permanent employees are entitled to fourteen (14) paid medical/sick leave days per calendar year.
Medical leave is intended solely for recovery from personal illness, injury, or medical appointments.

2.2 Medical Certificate (MC) Requirements:
- If medical leave is taken for more than two (2) consecutive working days, an official Medical Certificate (MC) issued by a licensed physician or registered clinic must be uploaded to the HR Portal within 48 hours of returning to work.
- Single-day sick leaves do not require a medical certificate for up to three (3) instances per year, after which an MC is required for all occurrences.
- Medical leave days do not roll over or accumulate; any unused medical leave expires at the end of each calendar year.

2.3 Hospitalization Leave:
In the event of hospital admission or surgical procedures requiring extended convalescence, employees are eligible for up to sixty (60) days of paid hospitalization leave per year (inclusive of the 14 days of standard medical leave).

SECTION 3: PARENTAL AND COMPASSIONATE LEAVE
3.1 Maternity and Paternity:
- Maternity leave: Sixteen (16) weeks of 100% paid leave for primary caregivers.
- Paternity leave: Four (4) weeks of 100% paid leave for secondary caregivers.

3.2 Compassionate / Bereavement Leave:
Employees are entitled to three (3) consecutive working days of paid compassionate leave upon the passing of an immediate family member (spouse, child, parent, or sibling). An additional two (2) days may be granted for overseas travel with manager approval.
"""
    page2.insert_text((50, 60), text_page2, fontsize=10, lineheight=1.4)

    filepath = OUTPUT_DIR / "Company_Leave_Policy.pdf"
    doc.save(str(filepath))
    doc.close()
    print(f"Generated: {filepath}")

def create_benefits_policy_pdf():
    doc = fitz.open()

    page1 = doc.new_page(width=595, height=842)
    text_page1 = """PEOPLESPHERE CORP - BENEFITS & WELLBEING
Document: Employee Healthcare & Wellness Benefits
Version: 2.5 | Effective: 2026
Applicable To: All Active Regular Employees

SECTION 1: OUTPATIENT MEDICAL REIMBURSEMENT
1.1 Annual Outpatient Limit:
All regular employees are eligible for up to $1,200 per calendar year in outpatient medical claim reimbursements.
Covered expenses include:
- General Practitioner (GP) consultations and prescribed medications.
- Specialist medical consultations upon referral from a primary physician.
- Diagnostic laboratory tests and diagnostic X-rays.

1.2 Claim Submission Guidelines:
- All medical reimbursement claims must be submitted via the HR Portal within thirty (30) days of the invoice or receipt date.
- Scanned copies of itemized receipts, consultation bills, and doctor memos must be attached.
- Approved claims are reimbursed in the subsequent month's payroll cycle.

SECTION 2: DENTAL AND VISION CARE
2.1 Dental Benefit:
Employees receive an annual dental allowance of $400 per calendar year.
This coverage covers routine dental examinations, dental scaling and polishing, fillings, root canal therapy, and extractions. Cosmetic dental procedures (such as teeth whitening) are not covered.

2.2 Vision Care Allowance:
An annual vision reimbursement of $200 is provided for prescription eyewear, contact lenses, or annual eye health examinations.

SECTION 3: MENTAL HEALTH & WELLNESS PROGRAM
3.1 Employee Assistance Program (EAP):
PeopleSphere provides confidential mental health and psychological support through our independent EAP partner.
Every employee and their immediate household members can access up to six (6) free, confidential counseling sessions per calendar year.

3.2 Monthly Fitness & Wellness Reimbursement:
Employees can claim up to $50 per month toward gym memberships, yoga/fitness studio passes, ergonomic home accessories, or mental wellness mobile app subscriptions (e.g., Headspace, Calm).
"""
    page1.insert_text((50, 60), text_page1, fontsize=10, lineheight=1.4)

    filepath = OUTPUT_DIR / "Healthcare_and_Wellness_Benefits.pdf"
    doc.save(str(filepath))
    doc.close()
    print(f"Generated: {filepath}")

def create_remote_work_policy_pdf():
    doc = fitz.open()

    page1 = doc.new_page(width=595, height=842)
    text_page1 = """PEOPLESPHERE CORP - WORKPLACE POLICIES
Document: Hybrid Work and Workplace Guidelines
Version: 4.0 | Effective: 2026
Applicable To: Engineering, Product, HR, and Operations Teams

SECTION 1: HYBRID WORK MODEL
1.1 Telecommuting Policy:
Eligible employees (including Software Engineering and HR teams) may work remotely for up to two (2) days per working week.
The specific remote days must be coordinated and approved in writing by the employee's direct Reporting Manager to ensure adequate office coverage.

1.2 Core Working Hours:
Regardless of physical work location, all employees must be online, reachable on Slack, and available for collaborative meetings during Core Working Hours:
10:00 AM to 4:00 PM in the employee's local time zone.

1.3 Work From Home (WFH) Equipment Allowance:
Upon joining, new full-time employees are provided a one-time reimbursement of up to $500 to equip their home workspace with an external monitor, ergonomic chair, keyboard, mouse, or desk lamp.
Receipts must be submitted within sixty (60) days of hire date.

SECTION 2: EXPENSE REPORTING & TRAVEL
2.1 Business Travel:
Prior manager pre-approval is strictly required for all domestic and international business travel.
Economy class air travel is mandated for flights under six (6) hours.

2.2 Meal Allowances during Travel:
Daily meal per-diem of $60 per day during authorized company business travel. Alcohol is not reimbursable.

SECTION 3: CODE OF CONDUCT & GRIEVANCE REPORTING
3.1 Professional Conduct:
PeopleSphere maintains zero tolerance for discrimination, harassment, bullying, or disrespectful communication.

3.2 Grievance and Whistleblower Hotline:
Employees may report workplace concerns confidentially or anonymously to ethics@peoplesphere.internal or reach out directly to the HR Operations Manager. All investigations are strictly confidential.
"""
    page1.insert_text((50, 60), text_page1, fontsize=10, lineheight=1.4)

    filepath = OUTPUT_DIR / "Remote_Work_and_Workplace_Guidelines.pdf"
    doc.save(str(filepath))
    doc.close()
    print(f"Generated: {filepath}")

if __name__ == "__main__":
    create_leave_policy_pdf()
    create_benefits_policy_pdf()
    create_remote_work_policy_pdf()
    print("All sample HR PDFs generated successfully!")

