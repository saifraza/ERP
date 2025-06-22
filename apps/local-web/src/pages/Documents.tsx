import DocumentManager from '../components/DocumentManager'

export default function Documents() {
  const handleAnalyze = (doc: any) => {
    console.log('Analyzing document:', doc)
    // TODO: Open AI analysis modal or navigate to analysis page
  }

  return (
    <div className="container mx-auto py-6">
      <DocumentManager onAnalyze={handleAnalyze} />
    </div>
  )
}