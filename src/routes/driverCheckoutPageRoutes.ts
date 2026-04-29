import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.render('driver-checkout', {
    defaultAmount: 100,
    defaultCurrency: 'MZN',
  });
});

export default router;
