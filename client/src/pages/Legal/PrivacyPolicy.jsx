import './Legal.css';

export default function PrivacyPolicy() {
    return (
        <div className="pp-container">
            <h1 className="pp-title">Privacy Policy</h1>

            <p className="pp-date">Last Updated: June 11, 2026</p>

            <p className="pp-intro">
                We value your privacy and are committed to protecting your personal
                information. This Privacy Policy explains what information we collect,
                how we use it, and how we keep it secure.
            </p>

            <h2 className="pp-section-title">Information We Collect</h2>

            <p className="pp-body">
                When you create an account using email and password, we may collect:
            </p>

            <ul className="pp-list">
                <li>Name</li>
                <li>Email address</li>
                <li>Username</li>
                <li>Profile picture (optional)</li>
            </ul>

            <p className="pp-body">
                When you sign in using third-party authentication providers such as
                Google or GitHub, we may collect:
            </p>

            <ul className="pp-list pp-body-spaced">
                <li>Name</li>
                <li>Email address</li>
                <li>Profile picture (if provided by the provider)</li>
            </ul>

            <h2 className="pp-section-title">How We Use Your Information</h2>
            <p className="pp-body-spaced">
                We use the collected information solely for account creation,
                authentication, profile management, and providing our services.
            </p>

            <h2 className="pp-section-title">Data Sharing</h2>
            <p className="pp-body-spaced">
                We do not sell, rent, trade, or share your personal information with
                third parties except when required by law.
            </p>

            <h2 className="pp-section-title">Data Security</h2>
            <p className="pp-body-spaced">
                We implement reasonable security measures to protect your personal
                information from unauthorized access, disclosure, alteration, or
                destruction. While no method of electronic storage or transmission is
                completely secure, we strive to use industry-standard practices to
                safeguard your data.
            </p>

            <h2 className="pp-section-title">Your Rights</h2>
            <p className="pp-body-spaced">
                You may request updates, corrections, or deletion of your account
                information at any time by contacting us.
            </p>

            <h2 className="pp-section-title">Changes to This Policy</h2>
            <p className="pp-body-spaced">
                We may update this Privacy Policy from time to time. Any changes will
                be posted on this page with an updated revision date.
            </p>

            <h2 className="pp-section-title">Contact Us</h2>
            <p className="pp-body">
                If you have any questions regarding this Privacy Policy, please contact
                us through the support channels provided within the application.
            </p>
        </div>
    );
}