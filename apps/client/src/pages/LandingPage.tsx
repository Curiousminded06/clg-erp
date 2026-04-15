import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-wrapper">
      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="hero-blob" style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>
          <div className="hero-content">
            <h1 className="hero-title">Streamline Your College Operations</h1>
            <p className="hero-subtitle">
              Complete management system for assignments, attendance, exams, chat, and campus updates.
              Trusted by educators and students.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn-hero-primary">Get Started Now</Link>
              <Link to="/dashboard" className="btn-hero-secondary">Explore Demo</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card card-1">📚 Assignments</div>
            <div className="floating-card card-2">💬 Chat</div>
            <div className="floating-card card-3">📊 Reports</div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="landing-features">
          <h2>Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📝</div>
              <h3>Smart Assignments</h3>
              <p>Faculty creates, students submit, and track grades in real-time with deadline management.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Attendance Tracking</h3>
              <p>Automated attendance marking with instant reports and analytics for better insights.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <h3>Exam Management</h3>
              <p>Schedule exams, manage results, and generate performance reports instantly.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <h3>Real-time Chat</h3>
              <p>Course-wise chatrooms for instant communication and collaborative learning.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📢</div>
              <h3>Announcements</h3>
              <p>Faculty shares notices and updates with targeted audience and expiry management.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <h3>Campus Events</h3>
              <p>Promote achievements and campus-wide events to keep community engaged.</p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="landing-testimonials">
          <h2>What Students Say</h2>
          <div className="testimonials-container">
            <div className="testimonial-card testimonial-1">
              <p className="testimonial-text">"The assignment feature has made it so easy to track my coursework and deadlines!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div>
                  <p className="author-name">Priya Sharma</p>
                  <p className="author-role">Student, CSE</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card testimonial-2">
              <p className="testimonial-text">"Real-time chat has transformed how we collaborate with classmates on projects!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div>
                  <p className="author-name">Rahul Kumar</p>
                  <p className="author-role">Student, ECE</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card testimonial-3">
              <p className="testimonial-text">"Managing attendance and results has never been this simple and efficient!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div>
                  <p className="author-name">Dr. Arun Singh</p>
                  <p className="author-role">Faculty, Mathematics</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="landing-team">
          <h2>Meet Our Team</h2>
          <div className="team-grid">
            <div className="team-card">
              <div className="team-image">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKkOEOhBi6vL_olEpNdIb2RejJAQ8810Axwh6iAVs06uNJkz4rFe-Pf8m7XR_2qgNdGyj-3yvaxV0DffBRVKkm9RwcgrkKZNLFo-sWlJ9yBA&s=10"
                  alt="Sahil Dale"
                />
              </div>
              <h3>Sahil Dale</h3>
              <p className="team-role">MERN Stack Developer</p>
              <p className="team-bio">Full-stack architect and lead developer. Passionate about building scalable systems.</p>
            </div>

            <div className="team-card">
              <div className="team-image">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrvnPnbK0v8IHJMUvvv3o5G70ihO_aqQSutA&s"
                  alt="Vaibhav Raikwar"
                />
              </div>
              <h3>Vaibhav Raikwar</h3>
              <p className="team-role">Backend Specialist</p>
              <p className="team-bio">Expert in API design and database optimization. Ensures system reliability.</p>
            </div>

            <div className="team-card">
              <div className="team-image">
                <img
                  src="data:image/jpeg;base64,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"
                  alt="Mayank Hatela"
                />
              </div>
              <h3>Mayank Hatela</h3>
              <p className="team-role">Frontend Developer</p>
              <p className="team-bio">UI/UX enthusiast creating beautiful and intuitive user experiences.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="landing-cta">
          <h2>Ready to Transform Your College?</h2>
          <p>Join hundreds of institutions using CLG ERP</p>
          <Link to="/login" className="btn-cta-primary">Sign In to Get Started</Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>CLG ERP</h4>
            <p>Complete college management system built for modern education.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
              <li><a href="#team">Team</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>Email: info@clgerp.com</p>
            <p>Phone: +1 (555) 123-4567</p>
            <p>Address: 123 College St, City, Country</p>
          </div>
        </div>
        
      </footer>
    </div>
  );
}
