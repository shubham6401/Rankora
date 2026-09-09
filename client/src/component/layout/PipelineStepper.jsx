import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/appLayout.css";

export default function PipelineStepper({ role = "executive" }) {
    const location = useLocation();
    const navigate = useNavigate();

    const executiveSteps = [
        { num: 1, title: "Unassigned", path: "/executive-pending-order", icon: "📦" },
        { num: 2, title: "Advance Payment", path: "/executive-pending-payment", icon: "💳" },
        { num: 3, title: "Assigned", path: "/executive-assigned-order", icon: "📤" },
        { num: 4, title: "In Progress", path: "/executive-in_progress-order", icon: "🚀" },
        { num: 5, title: "Pending Refund", path: "/executive-pending_refund-order", icon: "🔄" },
        { num: 6, title: "Verify Deliveries", path: "/executive-verify-orders", icon: "🔍" },
        { num: 7, title: "Completed", path: "/executive-completed-order", icon: "✅" },
    ];

    const mediatorSteps = [
        { num: 1, title: "New Offers", path: "/mediator-neworders", icon: "📥" },
        { num: 2, title: "In Progress", path: "/mediator-pending-orders", icon: "🚀" },
        { num: 3, title: "Pending Refund", path: "/mediator-refund_pending-orders", icon: "🔄" },
        { num: 4, title: "Pending Verification", path: "/mediator-pending-verification", icon: "⏳" },
        { num: 5, title: "Completed", path: "/mediator-completed-orders", icon: "✅" },
    ];

    const steps = role === "mediator" ? mediatorSteps : executiveSteps;

    return (
        <div className="pipeline-stepper-wrapper">
            <div className="pipeline-stepper-header">
                <span className="pipeline-stepper-title">
                    Order Pipeline
                </span>
            </div>

            <div className="pipeline-steps-track">
                {steps.map((step, idx) => {
                    const isActive = location.pathname === step.path;
                    return (
                        <div key={step.path} className="pipeline-step-wrapper">
                            <div
                                onClick={() => navigate(step.path)}
                                className={`pipeline-step-item ${isActive ? "active" : ""}`}
                            >
                                <span className="pipeline-step-num">{step.num}</span>
                                <span className="pipeline-step-text">{step.icon} {step.title}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <span className="pipeline-step-arrow">→</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
