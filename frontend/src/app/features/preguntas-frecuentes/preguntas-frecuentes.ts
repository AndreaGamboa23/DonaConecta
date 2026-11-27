import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Pregunta {
  question: string;
  answer: string;
  action?: { label: string; route: string };
}

@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './preguntas-frecuentes.html',
  styleUrl: './preguntas-frecuentes.scss',
})
export class PreguntasFrecuentes {
  protected readonly donationQuestions: Pregunta[] = [
    {
      question: '¿DonaConecta recibe dinero o transferencias?',
      answer:
        'No. La plataforma gestiona exclusivamente donaciones de bienes materiales. No hay pagos, transferencias bancarias, billeteras ni pasarelas de pago.',
    },
    {
      question: '¿Necesito registrarme para explorar el sitio?',
      answer:
        'No. Puedes leer la guía, conocer el proyecto y consultar las preguntas frecuentes sin crear una cuenta. El registro solo se solicitará para operaciones que realmente requieran una cuenta.',
      action: { label: 'Conocer el proyecto', route: '/nosotros' },
    },
    {
      question: '¿Qué bienes materiales puedo donar?',
      answer:
        'La guía presenta cinco categorías informativas: alimentos no perecibles, ropa de abrigo y frazadas, higiene y limpieza, productos para animales y útiles escolares.',
      action: { label: 'Ver las categorías', route: '/como-donar' },
    },
    {
      question: '¿En qué estado deben estar los productos?',
      answer:
        'Deben ser nuevos o estar en buen estado, limpios, completos y con fechas vigentes cuando corresponda. La recomendación busca que la entrega sea respetuosa y útil.',
    },
    {
      question: '¿Ya puedo registrar una donación?',
      answer:
        'Sí. Puedes explorar solicitudes publicadas por instituciones verificadas y, con una cuenta de donante, registrar un compromiso indicando bienes y cantidades disponibles. El seguimiento GPS todavía no está habilitado.',
      action: { label: 'Explorar solicitudes', route: '/explorar' },
    },
  ];

  protected readonly privacyQuestions: Pregunta[] = [
    {
      question: '¿El seguimiento GPS es obligatorio?',
      answer:
        'Todavía no está disponible. Cuando se habilite será voluntario, se iniciará manualmente y podrás detenerlo. No se usará como comprobante de entrega ni para rastrear a las personas.',
    },
    {
      question: '¿Puedo hablar con una institución desde la plataforma?',
      answer:
        'La mensajería privada todavía no está conectada. Puedes visitar el perfil público de una institución verificada y revisar sus solicitudes; la coordinación se realiza al registrar un compromiso real.',
      action: { label: 'Ver instituciones', route: '/instituciones' },
    },
    {
      question: '¿Cómo se protegen mis datos personales?',
      answer:
        'Consultar estas páginas no solicita datos personales. Si inicias sesión, la sesión se mantiene solo mientras esté abierta; las contraseñas se protegen con Argon2id y el backend autoriza cada operación sensible.',
    },
    {
      question: '¿Una ubicación compartida confirma que entregué la donación?',
      answer:
        'No. La recepción deberá ser confirmada por la institución. Las coordenadas nunca se usarán como prueba irrefutable de entrega o identidad.',
    },
  ];
}
