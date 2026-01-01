export interface PublicProduct {
    id: string;
    name: string;
    price: number;
    category: string;
    imageURL?: string; // Asumiendo que puede haber imagen, aunque en el tipo Product original no la vi explícita, pero es común. Si no, usaremos placeholder.
    description?: string; // Igual, si existe.
}
