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
        'No. Los compromisos, entregas y seguimiento están planificados, pero requieren autenticación, backend y SQL Server. Hoy solo está disponible la orientación informativa.',
    },
  ];

  protected readonly privacyQuestions: Pregunta[] = [
    {
      question: '¿El seguimiento GPS es obligatorio?',
      answer:
        'No. Está previsto como una función voluntaria, limitada a una entrega específica, con inicio manual, indicador visible y botón para detenerlo. No estará disponible hasta la fase correspondiente.',
    },
    {
      question: '¿Podré hablar con una institución desde la plataforma?',
      answer:
        'La mensajería interna está planificada para fases posteriores. Será privada y persistirá en SQL Server con autorización en backend, incluso en las conexiones en tiempo real.',
    },
    {
      question: '¿Cómo se protegerán mis datos personales?',
      answer:
        'La estrategia está documentada en seguridad y privacidad: mínimo privilegio, autorización por recurso, contraseñas con Argon2id, secretos fuera del repositorio y comunicaciones cifradas. Estas páginas informativas no solicitan datos personales ni los guardan en el navegador.',
    },
    {
      question: '¿Una ubicación compartida confirma que entregué la donación?',
      answer:
        'No. La recepción deberá ser confirmada por la institución. Las coordenadas nunca se usarán como prueba irrefutable de entrega o identidad.',
    },
  ];

  protected readonly moduleStates = [
    { module: 'Portada y navegación pública', state: 'Disponible', phase: '04 / 04.2' },
    { module: 'Guía para donar y preguntas frecuentes', state: 'Disponible', phase: '04.2' },
    { module: 'Catálogo de necesidades', state: 'Planificado', phase: '11' },
    { module: 'Registro y autenticación', state: 'Planificado', phase: '09' },
    { module: 'Puntos de acopio y mapas', state: 'Planificado', phase: '13' },
    { module: 'Seguimiento GPS', state: 'Planificado', phase: '14' },
    { module: 'Mensajería interna', state: 'Planificado', phase: '15' },
    { module: 'Dashboards y estadísticas reales', state: 'Planificado', phase: '17' },
  ];
}
