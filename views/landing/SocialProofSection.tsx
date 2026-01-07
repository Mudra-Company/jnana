import React from 'react';
import { Star, Quote } from 'lucide-react';
import { Card } from '../../components/Card';

export const SocialProofSection: React.FC = () => {
  const stats = [
    { value: '500+', label: 'Profili Karma creati' },
    { value: '50+', label: 'Aziende attive' },
    { value: '85%', label: 'Match rate' },
    { value: '3x', label: 'Faster hiring' },
  ];

  const testimonials = [
    {
      quote: "Con Jnana abbiamo finalmente capito le vere competenze del nostro team. Il turnover è sceso del 40% in 6 mesi.",
      author: "Maria Bianchi",
      role: "HR Director",
      company: "TechCorp Italia",
    },
    {
      quote: "Karma mi ha permesso di mostrare chi sono davvero, non solo dove ho lavorato. Ho trovato il lavoro perfetto per me.",
      author: "Marco Rossi",
      role: "Senior Developer",
      company: "Ex-freelancer",
    },
  ];

  return (
    <section className="py-24 px-4 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-brand text-4xl md:text-5xl font-bold bg-gradient-to-r from-jnana-sage to-violet-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-jnana-text/60 dark:text-gray-400 text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-jnana-text dark:text-white mb-4">
            Cosa dicono di noi
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border border-gray-100 dark:border-gray-700"
            >
              <Quote className="w-10 h-10 text-jnana-sage/30 dark:text-jnana-sage/20 mb-4" />
              <p className="text-lg text-jnana-text dark:text-gray-200 mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-jnana-sage to-violet-500 flex items-center justify-center text-white font-bold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-jnana-text dark:text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-jnana-text/60 dark:text-gray-400">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
