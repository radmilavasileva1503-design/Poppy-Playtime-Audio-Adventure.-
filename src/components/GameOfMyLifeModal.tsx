import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

interface GameOfMyLifeModalProps {
  onClose: () => void;
}

export const GameOfMyLifeModal: React.FC<GameOfMyLifeModalProps> = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-2xl w-full relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-4 mb-6">
            <Sparkles className="w-12 h-12 text-yellow-400" />
            <h2 className="text-3xl font-bold text-white">Играта на моя живот</h2>
          </div>
          <p className="text-zinc-300 text-lg mb-8">
            Поздравления, Истински герой! Ти отключи специална възможност.
            Искаш ли да създадем "Играта на моя живот"?
            Това е интерактивен процес, в който ти описваш ключови моменти от своето реално преживяване,
            а ние ще ги трансформираме във визуална история с помощта на AI.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                alert('Процесът започва...');
                onClose();
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl text-lg transition-colors"
            >
              Да, започни!
            </button>
            <button
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
            >
              Може би по-късно
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
