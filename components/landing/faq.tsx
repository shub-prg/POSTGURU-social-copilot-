import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need technical skills to use PostGuru?",
    answer: "Not at all! PostGuru is designed to be intuitive and user-friendly. If you can type a basic text prompt, you can use our AI to generate professional content."
  },
  {
    question: "Which social platforms are supported?",
    answer: "Currently, we fully support X (Twitter), LinkedIn, Facebook, and Instagram. TikTok support is coming in our next major update."
  },
  {
    question: "Can I edit the AI-generated posts?",
    answer: "Absolutely. The AI provides a strong starting point, but you have full control to edit text, swap images, and adjust timings before anything is published."
  },
  {
    question: "Is there a limit to how many posts I can schedule?",
    answer: "With our free tier, you can schedule up to 30 posts per month. Our premium plan allows for unlimited scheduling."
  },
  {
    question: "How does the AI know what my brand voice is?",
    answer: "You can set up custom 'Brand Personas' in your dashboard, giving the AI guidelines on your preferred tone, style, and vocabulary."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="container px-4 md:px-8 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about the product.
          </p>
        </div>

        <Accordion className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
              <AccordionTrigger className="text-left text-lg hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-sans text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
