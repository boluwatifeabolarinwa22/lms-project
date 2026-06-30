import { computeAnalytics } from '../services/analyticsEngine.js';

export async function forceRecompute(req, res) {
  const { studentId, courseId } = req.params;

  if (!studentId || !courseId) {
    return res.status(400).json({ error: 'Student ID and Course ID are required' });
  }

  try {
    const record = await computeAnalytics(studentId, courseId);
    if (!record) {
      return res.status(404).json({ error: 'Analytics record could not be calculated (verify enrollment)' });
    }
    return res.json({ message: 'Analytics recomputed successfully', record });
  } catch (error) {
    console.error('Error in manual analytics recompute:', error);
    return res.status(500).json({ error: 'Failed to recompute analytics' });
  }
}
