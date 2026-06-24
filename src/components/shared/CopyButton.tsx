import {FC, useState} from 'react';
import {Clipboard, ClipboardCheck} from "react-bootstrap-icons";

interface CopyButtonProps {
    textToCopy: string;
}

const CopyButton: FC<CopyButtonProps> = ({textToCopy}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button type="button" className="btn btn-outline-secondary" onClick={handleCopy} title="Copiar al portapapeles">
            {copied ? <><ClipboardCheck className="text-success"/> ¡Copiado!</> : <><Clipboard/> Copiar</>}
        </button>
    );
};

export default CopyButton;