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
      question: '¿Ya puedo registrar una donación o seguir una entrega?',
      answer:
        'Todavía no. Por ahora puedes informarte y preparar tus bienes. El registro y el seguimiento se activarán cuando la plataforma de servicios esté lista para usar.',
    },
  ];

  protected readonly privacyQuestions: Pregunta[] = [
    {
      question: '¿El seguimiento GPS será obligatorio?',
      answer:
        'No. Cuando esté disponible, será voluntario, se iniciará manualmente y podrás detenerlo. No se usará como comprobante de entrega ni para rastrear a las personas.',
    },
    {
      question: '¿Podré hablar con una institución desde la plataforma?',
      answer:
        'La mensajería llegará como parte de los servicios de la plataforma. Será privada entre las personas participantes y no sustituirá la confirmación de recepción de la institución.',
    },
    {
      question: '¿Cómo se protegerán mis datos personales?',
      answer:
        'Consultar estas páginas no solicita datos personales ni los guarda en el navegador. Las futuras funciones de cuenta tendrán acceso limitado, autorización por recurso y contraseñas protegidas.',
    },
    {
      question: '¿Una ubicación compartida confirma que entregué la donación?',
      answer:
        'No. La recepción deberá ser confirmada por la institución. Las coordenadas nunca se usarán como prueba irrefutable de entrega o identidad.',
    },
  ];
}
