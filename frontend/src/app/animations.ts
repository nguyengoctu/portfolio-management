import { trigger, transition, style, animate, query } from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    // Set initial styles for entering and leaving pages
    query(':enter, :leave', 
      style({ 
        position: 'absolute', 
        width: '100%',
        height: '100%',
        top: 0,
        left: 0
      }), 
      { optional: true }
    ),
    
    // Start with the entering page hidden
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'translateX(10px)'
      })
    ], { optional: true }),
    
    // Animate both simultaneously with faster timing
    query(':leave', [
      animate('120ms ease-in', style({ 
        opacity: 0,
        transform: 'translateX(-10px)'
      }))
    ], { optional: true }),
    
    query(':enter', [
      animate('150ms 20ms ease-out', style({ 
        opacity: 1,
        transform: 'translateX(0)'
      }))
    ], { optional: true })
  ])
]);