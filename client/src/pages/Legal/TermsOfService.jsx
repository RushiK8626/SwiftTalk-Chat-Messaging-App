import './Legal.css';

export default function TermsOfService() {
    return (
        <div className="pp-container">
            <h1 className="pp-title">Terms of Service</h1>

            <p className="pp-date">Last Updated: June 11, 2026</p>

            <p className="pp-intro">
                By creating an account or using this application, you agree to these
                Terms of Service. If you do not agree with any part of these terms,
                please do not use the service.
            </p>

            <h2 className="pp-section-title">Account Registration</h2>
            <p className="pp-body-spaced">
                To access certain features, you may be required to create an account.
                You are responsible for maintaining the confidentiality of your account
                and for all activities that occur under your account.
            </p>

            <h2 className="pp-section-title">User Information</h2>
            <p className="pp-body-spaced">
                When registering, you may provide information such as your name, email
                address, username, and an optional profile picture. If you sign in
                using Google or GitHub, we may receive information provided by those
                services, including your name, email address, and profile picture if
                available.
            </p>

            <h2 className="pp-section-title">Acceptable Use</h2>
            <p className="pp-body">You agree not to:</p>
            <ul className="pp-list pp-body-spaced">
                <li>Use the service for unlawful purposes.</li>
                <li>Attempt to gain unauthorized access to the service or its systems.</li>
                <li>Interfere with the operation or security of the service.</li>
                <li>Impersonate another person or provide false information.</li>
                <li>Use the service in a way that may harm other users.</li>
            </ul>

            <h2 className="pp-section-title">Intellectual Property</h2>
            <p className="pp-body-spaced">
                The service, including its design, content, features, and functionality,
                is owned by the application owner and is protected by applicable laws.
                You may not copy, modify, distribute, or reverse engineer any part of
                the service unless permitted by law.
            </p>

            <h2 className="pp-section-title">Service Availability</h2>
            <p className="pp-body-spaced">
                We strive to keep the service available and functioning properly.
                However, we do not guarantee uninterrupted availability and may modify,
                suspend, or discontinue any part of the service at any time.
            </p>

            <h2 className="pp-section-title">Limitation of Liability</h2>
            <p className="pp-body-spaced">
                The service is provided on an "as is" and "as available" basis. To the
                fullest extent permitted by law, we disclaim all warranties and shall
                not be liable for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of the service.
            </p>

            <h2 className="pp-section-title">Account Termination</h2>
            <p className="pp-body-spaced">
                We reserve the right to suspend or terminate accounts that violate these
                Terms of Service or engage in activities that may harm the service or
                other users.
            </p>

            <h2 className="pp-section-title">Changes to These Terms</h2>
            <p className="pp-body-spaced">
                We may update these Terms of Service from time to time. Continued use of
                the service after changes are posted constitutes acceptance of the
                revised terms.
            </p>

            <h2 className="pp-section-title">Contact</h2>
            <p className="pp-body">
                If you have any questions regarding these Terms of Service, please
                contact us through the support channels provided within the application.
            </p>
        </div>
    );
}