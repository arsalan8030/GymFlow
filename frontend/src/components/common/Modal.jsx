import { X } from "lucide-react";

export default function Modal({ title, children, onClose }) {
    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
            <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
                <header>
                    <h2>{title}</h2>
                    <button onClick={onClose} aria-label="Close"><X size={20} /></button>
                </header>
                {children}
            </section>
        </div>
    );
}
