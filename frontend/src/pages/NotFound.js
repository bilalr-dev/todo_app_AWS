import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Card>
          <CardContent className="p-12">
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Page Not Found
              </h2>
              <p className="text-muted-foreground mb-8">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
              
              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-sm text-muted-foreground">
              <p>
                If you think this is an error, please{' '}
                <a href="mailto:support@todoapp.com" className="text-primary hover:underline">
                  contact support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
