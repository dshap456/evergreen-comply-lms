import React, { useState, useEffect } from 'react'
import { QuizQuestion, QuizAttempt, LessonProgress } from '../../api/entities'

export default function QuizTaker({ lesson, course, user, onCompleted, onClose }) {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [previousAttempts, setPreviousAttempts] = useState([])
  const [startTime] = useState(Date.now())

  useEffect(() => {
    loadQuizData()
  }, [lesson.id])

  const loadQuizData = async () => {
    try {
      // Load quiz questions
      const questionsData = await QuizQuestion.list(lesson.id)
      console.log('Loaded quiz questions:', questionsData)
      
      // Load previous attempts
      const attempts = await QuizAttempt.list(user.id, lesson.id)
      console.log('Previous attempts:', attempts)
      
      setQuestions(questionsData)
      setPreviousAttempts(attempts)
      
      // Initialize answers object
      const initialAnswers = {}
      questionsData.forEach(q => {
        initialAnswers[q.id] = ''
      })
      setAnswers(initialAnswers)
      
    } catch (error) {
      console.error('Error loading quiz data:', error)
    }
    setLoading(false)
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmitQuiz = async () => {
    setSubmitting(true)
    
    try {
      // Calculate score
      let correctAnswers = 0
      const questionResults = questions.map(question => {
        const userAnswer = answers[question.id]
        const isCorrect = userAnswer === question.correct_answer
        if (isCorrect) correctAnswers++
        
        return {
          question_id: question.id,
          question_text: question.question_text,
          user_answer: userAnswer,
          correct_answer: question.correct_answer,
          is_correct: isCorrect
        }
      })
      
      const score = Math.round((correctAnswers / questions.length) * 100)
      const passingScore = lesson.passing_score || 80
      const passed = score >= passingScore
      const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60) // minutes
      const attemptNumber = previousAttempts.length + 1
      
      console.log('Quiz submission:', {
        score,
        passingScore,
        passed,
        timeSpent,
        attemptNumber
      })
      
      // Save quiz attempt
      const attemptData = {
        user_id: user.id,
        lesson_id: lesson.id,
        attempt_number: attemptNumber,
        score: score,
        passed: passed,
        answers: answers,
        time_spent: timeSpent,
        created_date: new Date().toISOString()
      }
      
      await QuizAttempt.create(attemptData)
      
      // Update lesson progress if passed
      if (passed) {
        await LessonProgress.markCompleted(user.id, lesson.id, timeSpent)
      } else {
        // Mark as in progress if not passed
        await LessonProgress.markInProgress(user.id, lesson.id)
      }
      
      // Show results
      setQuizResults({
        score,
        passingScore,
        passed,
        correctAnswers,
        totalQuestions: questions.length,
        questionResults,
        attemptNumber,
        timeSpent
      })
      setShowResults(true)
      
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    }
    
    setSubmitting(false)
  }

  const handleRetakeQuiz = () => {
    // Reset quiz state
    setCurrentQuestionIndex(0)
    setShowResults(false)
    setQuizResults(null)
    
    // Clear answers
    const initialAnswers = {}
    questions.forEach(q => {
      initialAnswers[q.id] = ''
    })
    setAnswers(initialAnswers)
  }

  const handleFinishQuiz = () => {
    onCompleted(lesson.id, quizResults.score, quizResults.passed)
  }

  const isQuizComplete = () => {
    return questions.every(q => answers[q.id] && answers[q.id].trim() !== '')
  }

  const bestPreviousScore = previousAttempts.length > 0 
    ? Math.max(...previousAttempts.map(a => a.score))
    : 0

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Quiz Results</h2>
            <p className="text-slate-600">{lesson.title}</p>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                quizResults.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {quizResults.passed ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className={`text-2xl font-bold mb-2 ${
                quizResults.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {quizResults.passed ? 'Passed!' : 'Not Passed'}
              </h3>
              
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {quizResults.score}%
              </div>
              
              <p className="text-slate-600">
                {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correct
              </p>
              
              <p className="text-sm text-slate-500 mt-2">
                Passing score: {quizResults.passingScore}% • Attempt #{quizResults.attemptNumber}
              </p>
              
              {!quizResults.passed && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You need {quizResults.passingScore}% to pass this quiz. 
                    You can retake the quiz to improve your score.
                  </p>
                </div>
              )}
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Question Review</h4>
              {quizResults.questionResults.map((result, index) => (
                <div key={result.question_id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-slate-900">Question {index + 1}</h5>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-slate-700 mb-3">{result.question_text}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className={`p-2 rounded ${
                      result.is_correct ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <span className="font-medium">Your answer: </span>
                      <span className={result.is_correct ? 'text-green-700' : 'text-red-700'}>
                        {result.user_answer || 'No answer'}
                      </span>
                    </div>
                    
                    {!result.is_correct && (
                      <div className="p-2 rounded bg-green-50">
                        <span className="font-medium">Correct answer: </span>
                        <span className="text-green-700">{result.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-600">
                {previousAttempts.length > 0 && (
                  <span>Previous best score: {bestPreviousScore}%</span>
                )}
              </div>
              <div className="flex space-x-3">
                {!quizResults.passed && (
                  <button
                    onClick={handleRetakeQuiz}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200"
                  >
                    Retake Quiz
                  </button>
                )}
                <button
                  onClick={handleFinishQuiz}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700"
                >
                  {quizResults.passed ? 'Continue Course' : 'Back to Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-slate-500">{course.title}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Quiz
                </span>
                {lesson.is_final_quiz && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Final Quiz
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{lesson.title}</h2>
              {lesson.description && (
                <p className="text-slate-600 mt-1">{lesson.description}</p>
              )}
              
              <div className="mt-3 flex items-center space-x-4 text-sm text-slate-600">
                <span>Passing Score: {lesson.passing_score || 80}%</span>
                <span>•</span>
                <span>{questions.length} Questions</span>
                {previousAttempts.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Previous Best: {bestPreviousScore}%</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {questions.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  {questions[currentQuestionIndex].question_text}
                </h3>
                
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(option => {
                    const optionText = questions[currentQuestionIndex][`option_${option.toLowerCase()}`]
                    if (!optionText) return null
                    
                    return (
                      <label key={option} className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name={`question_${questions[currentQuestionIndex].id}`}
                          value={option}
                          checked={answers[questions[currentQuestionIndex].id] === option}
                          onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span className="ml-3 text-slate-700">
                          <span className="font-medium">{option}.</span> {optionText}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!isQuizComplete() || submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
          
          {!isQuizComplete() && (
            <p className="text-center text-sm text-amber-600 mt-2">
              Please answer all questions before submitting
            </p>
          )}
        </div>
      </div>
    </div>
  )
}